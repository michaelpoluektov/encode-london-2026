import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from "node:sqlite";
import { app } from "electron";
import { Kysely, SqliteDialect, sql } from "kysely";
import { z } from "zod";
import type {
  ProjectLayoutState,
  ProjectOpenResult,
  ShadilyManifest,
} from "../../shared/contracts";
import {
  projectIdSchema,
  projectLayoutStateSchema,
} from "../../shared/contracts";

type ProjectMetadataTable = {
  project_id: string;
  project_name: string;
  folder_path: string;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
};

type ProjectLayoutsTable = {
  project_id: string;
  layout_json: string;
  updated_at: string;
};

type MetadataDatabase = {
  project_layouts: ProjectLayoutsTable;
  project_metadata: ProjectMetadataTable;
};

const projectMetadataRowSchema = z.object({
  project_id: projectIdSchema,
  folder_path: z.string().min(1),
});

const projectLayoutRowSchema = z.object({
  layout_json: z.string().min(1),
});

type ProjectMetadataRow = z.infer<typeof projectMetadataRowSchema>;

const READ_QUERY_PATTERN = /^\s*(select|pragma|with|explain)\b/i;

class NodeSqliteStatementAdapter {
  readonly #statement: StatementSync;
  readonly #reader: boolean;

  constructor(statement: StatementSync, statementSql: string) {
    this.#statement = statement;
    this.#reader = READ_QUERY_PATTERN.test(statementSql);
  }

  get reader(): boolean {
    return this.#reader;
  }

  all(parameters: ReadonlyArray<unknown>): unknown[] {
    return this.#statement.all(...(parameters as SQLInputValue[])) as unknown[];
  }

  run(parameters: ReadonlyArray<unknown>): {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  } {
    const result = this.#statement.run(...(parameters as SQLInputValue[]));

    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  iterate(parameters: ReadonlyArray<unknown>): IterableIterator<unknown> {
    return this.#statement.iterate(
      ...(parameters as SQLInputValue[]),
    ) as IterableIterator<unknown>;
  }
}

class NodeSqliteDatabaseAdapter {
  readonly #database: DatabaseSync;

  constructor(databasePath: string) {
    this.#database = new DatabaseSync(databasePath);
  }

  close(): void {
    this.#database.close();
  }

  prepare(statementSql: string): NodeSqliteStatementAdapter {
    return new NodeSqliteStatementAdapter(
      this.#database.prepare(statementSql),
      statementSql,
    );
  }
}

let databasePromise: Promise<Kysely<MetadataDatabase>> | null = null;

const getDatabasePath = (): string =>
  join(app.getPath("userData"), "project-metadata.sqlite");

const createDatabase = async (): Promise<Kysely<MetadataDatabase>> => {
  const db = new Kysely<MetadataDatabase>({
    dialect: new SqliteDialect({
      database: new NodeSqliteDatabaseAdapter(getDatabasePath()),
    }),
  });

  await sql`
    CREATE TABLE IF NOT EXISTS project_metadata (
      project_id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      folder_path TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_opened_at TEXT NOT NULL
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS project_layouts (
      project_id TEXT PRIMARY KEY,
      layout_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `.execute(db);

  return db;
};

const getDatabase = (): Promise<Kysely<MetadataDatabase>> => {
  databasePromise ??= createDatabase();
  return databasePromise;
};

const getTimestamp = (): string => new Date().toISOString();

export const upsertProjectMetadata = async (
  folderPath: string,
  manifest: ShadilyManifest,
): Promise<void> => {
  const db = await getDatabase();
  const now = getTimestamp();

  await db
    .deleteFrom("project_metadata")
    .where("folder_path", "=", folderPath)
    .where("project_id", "!=", manifest.projectId)
    .execute();

  await db
    .insertInto("project_metadata")
    .values({
      project_id: manifest.projectId,
      project_name: manifest.name,
      folder_path: folderPath,
      created_at: manifest.created,
      updated_at: manifest.modified,
      last_opened_at: now,
    })
    .onConflict((oc) =>
      oc.column("project_id").doUpdateSet({
        project_name: manifest.name,
        folder_path: folderPath,
        updated_at: manifest.modified,
        last_opened_at: now,
      }),
    )
    .execute();
};

export const upsertOpenProjectMetadata = async (
  project: ProjectOpenResult,
): Promise<void> => {
  await upsertProjectMetadata(project.folderPath, project.manifest);
};

export const listRecentProjectMetadata = async (): Promise<
  readonly ProjectMetadataRow[]
> => {
  const db = await getDatabase();

  return projectMetadataRowSchema
    .array()
    .parse(
      await db
        .selectFrom("project_metadata")
        .select(["project_id", "folder_path"])
        .orderBy("last_opened_at", "desc")
        .execute(),
    );
};

export const deleteProjectMetadata = async (
  projectId: string,
): Promise<void> => {
  const db = await getDatabase();

  await db
    .deleteFrom("project_metadata")
    .where("project_id", "=", projectId)
    .execute();
};

export const deleteProjectMetadataByPath = async (
  folderPath: string,
): Promise<void> => {
  const db = await getDatabase();

  await db
    .deleteFrom("project_metadata")
    .where("folder_path", "=", folderPath)
    .execute();
};

export const getProjectLayout = async (
  projectId: string,
): Promise<ProjectLayoutState | null> => {
  const db = await getDatabase();
  const row = await db
    .selectFrom("project_layouts")
    .select("layout_json")
    .where("project_id", "=", projectId)
    .executeTakeFirst();

  if (row === undefined) {
    return null;
  }

  try {
    const parsedRow = projectLayoutRowSchema.parse(row);
    return projectLayoutStateSchema.parse(JSON.parse(parsedRow.layout_json));
  } catch {
    await db
      .deleteFrom("project_layouts")
      .where("project_id", "=", projectId)
      .execute();
    return null;
  }
};

export const saveProjectLayout = async (
  projectId: string,
  layout: ProjectLayoutState,
): Promise<void> => {
  const db = await getDatabase();
  const serializedLayout = JSON.stringify(
    projectLayoutStateSchema.parse(layout),
  );
  const now = getTimestamp();

  await db
    .insertInto("project_layouts")
    .values({
      project_id: projectId,
      layout_json: serializedLayout,
      updated_at: now,
    })
    .onConflict((oc) =>
      oc.column("project_id").doUpdateSet({
        layout_json: serializedLayout,
        updated_at: now,
      }),
    )
    .execute();
};

export const hasProjectFolder = (folderPath: string): boolean =>
  existsSync(folderPath);
