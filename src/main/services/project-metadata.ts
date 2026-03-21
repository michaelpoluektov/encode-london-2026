import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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
  ProjectCheckpoint,
  ProjectLayoutState,
  ProjectOpenResult,
  ShadilyManifest,
} from "../../shared/contracts";
import {
  projectCheckpointSchema,
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

type ProjectCheckpointsTable = {
  id: string;
  project_id: string;
  thread_id: string;
  message_id: string;
  file_snapshots_json: string;
  preview_path: string | null;
  fragment_shader_source: string | null;
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
  project_checkpoints: ProjectCheckpointsTable;
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

  await sql`
    CREATE TABLE IF NOT EXISTS project_checkpoints (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      file_snapshots_json TEXT NOT NULL,
      preview_path TEXT,
      fragment_shader_source TEXT,
      created_at TEXT NOT NULL
    )
  `.execute(db);

  // Migrate existing databases that lack the fragment_shader_source column.
  await sql`
    ALTER TABLE project_checkpoints ADD COLUMN fragment_shader_source TEXT
  `
    .execute(db)
    .catch(() => {
      // Column already exists — ignore.
    });

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

export const createCheckpoint = async ({
  projectId,
  threadId,
  messageId,
  fileSnapshotsJson,
  previewPath,
  fragmentShaderSource,
}: {
  projectId: string;
  threadId: string;
  messageId: string;
  fileSnapshotsJson: string;
  previewPath: string | null;
  fragmentShaderSource: string | null;
}): Promise<void> => {
  const db = await getMetadataDatabase();
  await db
    .insertInto("project_checkpoints")
    .values({
      id: randomUUID(),
      project_id: projectId,
      thread_id: threadId,
      message_id: messageId,
      file_snapshots_json: fileSnapshotsJson,
      preview_path: previewPath,
      fragment_shader_source: fragmentShaderSource,
      created_at: getTimestamp(),
    })
    .execute();
};

export const listCheckpoints = async (
  projectId: string,
  threadId: string,
): Promise<ProjectCheckpoint[]> => {
  const db = await getMetadataDatabase();
  const rows = await db
    .selectFrom("project_checkpoints")
    .select([
      "id",
      "project_id",
      "thread_id",
      "message_id",
      "preview_path",
      "fragment_shader_source",
      "created_at",
    ])
    .where("project_id", "=", projectId)
    .where("thread_id", "=", threadId)
    .orderBy("created_at", "asc")
    .execute();

  return rows.map((row) =>
    projectCheckpointSchema.parse({
      id: row.id,
      projectId: row.project_id,
      threadId: row.thread_id,
      messageId: row.message_id,
      previewPath: row.preview_path,
      fragmentShaderSource: row.fragment_shader_source ?? null,
      createdAt: row.created_at,
    }),
  );
};

export const getCheckpointFileSnapshots = async (
  checkpointId: string,
): Promise<Record<string, string> | null> => {
  const db = await getMetadataDatabase();
  const row = await db
    .selectFrom("project_checkpoints")
    .select(["file_snapshots_json", "project_id"])
    .where("id", "=", checkpointId)
    .executeTakeFirst();

  if (row === undefined) return null;

  try {
    return JSON.parse(row.file_snapshots_json) as Record<string, string>;
  } catch {
    return null;
  }
};

export const getCheckpointProjectId = async (
  checkpointId: string,
): Promise<string | null> => {
  const db = await getMetadataDatabase();
  const row = await db
    .selectFrom("project_checkpoints")
    .select("project_id")
    .where("id", "=", checkpointId)
    .executeTakeFirst();
  return row?.project_id ?? null;
};

export const getCheckpointInfo = async (
  checkpointId: string,
): Promise<{
  projectId: string;
  threadId: string;
  messageId: string;
} | null> => {
  const db = await getMetadataDatabase();
  const row = await db
    .selectFrom("project_checkpoints")
    .select(["project_id", "thread_id", "message_id"])
    .where("id", "=", checkpointId)
    .executeTakeFirst();
  if (row === undefined) return null;
  return {
    projectId: row.project_id,
    threadId: row.thread_id,
    messageId: row.message_id,
  };
};

export const saveCheckpointPreview = (
  folderPath: string,
  dataUrl: string,
): string => {
  const checkpointsDir = join(folderPath, ".shadily", "checkpoints");
  mkdirSync(checkpointsDir, { recursive: true });
  const base64Payload = dataUrl.replace(/^data:image\/png;base64,/, "");
  const imageBuffer = Buffer.from(base64Payload, "base64");
  const imageName = `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const imagePath = join(checkpointsDir, imageName);
  writeFileSync(imagePath, imageBuffer);
  return imagePath;
};
