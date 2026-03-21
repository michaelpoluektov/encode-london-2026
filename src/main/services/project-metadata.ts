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

type ChatThreadsTable = {
  id: string;
  project_id: string;
  codex_thread_id: string | null;
  title: string | null;
  status: "regular" | "archived";
  created_at: string;
  updated_at: string;
  last_used_at: string;
  last_message_at: string | null;
};

type ProjectChatStateTable = {
  project_id: string;
  active_thread_id: string | null;
};

type ChatMessagesTable = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  sequence_no: number;
  run_id: string | null;
  status_type: string | null;
  status_reason: string | null;
  error_json: string | null;
  metadata_json: string;
  created_at: string;
  updated_at: string;
};

type ChatMessagePartsTable = {
  id: string;
  message_id: string;
  ordinal: number;
  part_type: "text" | "reasoning" | "image" | "file" | "data" | "tool-call";
  parent_part_id: string | null;
  text_value: string | null;
  image_path: string | null;
  file_path: string | null;
  filename: string | null;
  mime_type: string | null;
  data_name: string | null;
  data_json: string | null;
  tool_call_id: string | null;
  tool_name: string | null;
  tool_args_text: string | null;
  tool_result_text: string | null;
  tool_is_error: number | null;
};

type ChatAttachmentsTable = {
  id: string;
  message_id: string;
  ordinal: number;
  attachment_type: "image" | "file";
  name: string | null;
  mime_type: string | null;
  path: string | null;
  content_url: string | null;
  status: "complete" | "pending";
  metadata_json: string;
};

type ChatRunsTable = {
  id: string;
  thread_id: string;
  project_id: string;
  codex_thread_id: string | null;
  kind: "prompt" | "tool_resume";
  trigger_message_id: string | null;
  result_message_id: string | null;
  status: "running" | "completed" | "failed" | "cancelled";
  input_tokens: number | null;
  cached_input_tokens: number | null;
  output_tokens: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

type ChatRunItemsTable = {
  id: string;
  run_id: string;
  codex_item_id: string | null;
  ordinal: number;
  item_type:
    | "agent_message"
    | "reasoning"
    | "command_execution"
    | "file_change"
    | "mcp_tool_call"
    | "web_search"
    | "todo_list"
    | "error";
  status: string | null;
  payload_json: string;
  created_at: string;
};

export type MetadataDatabase = {
  chat_attachments: ChatAttachmentsTable;
  chat_message_parts: ChatMessagePartsTable;
  chat_messages: ChatMessagesTable;
  chat_run_items: ChatRunItemsTable;
  chat_runs: ChatRunsTable;
  chat_threads: ChatThreadsTable;
  project_chat_state: ProjectChatStateTable;
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

  await sql`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      codex_thread_id TEXT,
      title TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_used_at TEXT NOT NULL,
      last_message_at TEXT
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS project_chat_state (
      project_id TEXT PRIMARY KEY,
      active_thread_id TEXT
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL,
      sequence_no INTEGER NOT NULL,
      run_id TEXT,
      status_type TEXT,
      status_reason TEXT,
      error_json TEXT,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(thread_id, sequence_no)
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS chat_message_parts (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      ordinal INTEGER NOT NULL,
      part_type TEXT NOT NULL,
      parent_part_id TEXT,
      text_value TEXT,
      image_path TEXT,
      file_path TEXT,
      filename TEXT,
      mime_type TEXT,
      data_name TEXT,
      data_json TEXT,
      tool_call_id TEXT,
      tool_name TEXT,
      tool_args_text TEXT,
      tool_result_text TEXT,
      tool_is_error INTEGER,
      UNIQUE(message_id, ordinal)
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS chat_attachments (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      ordinal INTEGER NOT NULL,
      attachment_type TEXT NOT NULL,
      name TEXT,
      mime_type TEXT,
      path TEXT,
      content_url TEXT,
      status TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      UNIQUE(message_id, ordinal)
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS chat_runs (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      codex_thread_id TEXT,
      kind TEXT NOT NULL,
      trigger_message_id TEXT,
      result_message_id TEXT,
      status TEXT NOT NULL,
      input_tokens INTEGER,
      cached_input_tokens INTEGER,
      output_tokens INTEGER,
      error_message TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT
    )
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS chat_run_items (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      codex_item_id TEXT,
      ordinal INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      status TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(run_id, ordinal)
    )
  `.execute(db);

  return db;
};

export const getMetadataDatabase = (): Promise<Kysely<MetadataDatabase>> => {
  databasePromise ??= createDatabase();
  return databasePromise;
};

export const getTimestamp = (): string => new Date().toISOString();

export const upsertProjectMetadata = async (
  folderPath: string,
  manifest: ShadilyManifest,
): Promise<void> => {
  const db = await getMetadataDatabase();
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
  const db = await getMetadataDatabase();

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
  const db = await getMetadataDatabase();

  await db
    .deleteFrom("project_metadata")
    .where("project_id", "=", projectId)
    .execute();
};

export const deleteProjectMetadataByPath = async (
  folderPath: string,
): Promise<void> => {
  const db = await getMetadataDatabase();

  await db
    .deleteFrom("project_metadata")
    .where("folder_path", "=", folderPath)
    .execute();
};

export const getProjectLayout = async (
  projectId: string,
): Promise<ProjectLayoutState | null> => {
  const db = await getMetadataDatabase();
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

export const getProjectFolderPath = async (
  projectId: string,
): Promise<string | null> => {
  const db = await getMetadataDatabase();
  const row = await db
    .selectFrom("project_metadata")
    .select("folder_path")
    .where("project_id", "=", projectId)
    .executeTakeFirst();

  return row?.folder_path ?? null;
};

export const saveProjectLayout = async (
  projectId: string,
  layout: ProjectLayoutState,
): Promise<void> => {
  const db = await getMetadataDatabase();
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
