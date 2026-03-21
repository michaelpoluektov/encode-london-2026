import { z } from "zod";
import type {
  ChatMessage,
  ChatMessagePart,
  ChatMessagePartInput,
  ChatMessageStatus,
  ChatThreadDetail,
  ChatThreadSummary,
} from "../../shared/contracts";
import {
  chatMessageSchema,
  chatThreadDetailSchema,
  chatThreadSummarySchema,
} from "../../shared/contracts";
import { getMetadataDatabase, getTimestamp } from "./project-metadata";

type ChatThreadRow = {
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

type ChatMessageRow = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  run_id: string | null;
  status_type: string | null;
  status_reason: string | null;
  error_json: string | null;
  created_at: string;
  updated_at: string;
};

type ChatPartRow = {
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

type ChatRunKind = "prompt" | "tool_resume";
type ChatRunStatus = "running" | "completed" | "failed" | "cancelled";
type ChatRunItemType =
  | "agent_message"
  | "reasoning"
  | "command_execution"
  | "file_change"
  | "mcp_tool_call"
  | "web_search"
  | "todo_list"
  | "error";

const jsonRecordSchema = z.record(z.string(), z.unknown());

const buildThreadSummary = (row: ChatThreadRow): ChatThreadSummary =>
  chatThreadSummarySchema.parse({
    id: row.id,
    projectId: row.project_id,
    codexThreadId: row.codex_thread_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at,
    lastMessageAt: row.last_message_at,
  });

const buildMessageStatus = (row: ChatMessageRow): ChatMessageStatus | null => {
  if (row.status_type === null) {
    return null;
  }

  return {
    type: row.status_type,
    reason: row.status_reason,
    errorJson: row.error_json,
  } as ChatMessageStatus;
};

const buildMessagePart = (row: ChatPartRow): ChatMessagePart => {
  switch (row.part_type) {
    case "text":
      return {
        id: row.id,
        type: "text",
        text: row.text_value ?? "",
        parentPartId: row.parent_part_id,
      };
    case "reasoning":
      return {
        id: row.id,
        type: "reasoning",
        text: row.text_value ?? "",
        parentPartId: row.parent_part_id,
      };
    case "image":
      return {
        id: row.id,
        type: "image",
        imagePath: row.image_path ?? "",
        filename: row.filename,
      };
    case "file":
      return {
        id: row.id,
        type: "file",
        filePath: row.file_path ?? "",
        filename: row.filename,
        mimeType: row.mime_type,
      };
    case "data":
      return {
        id: row.id,
        type: "data",
        name: row.data_name ?? "data",
        dataJson: row.data_json ?? "null",
      };
    case "tool-call":
      return {
        id: row.id,
        type: "tool-call",
        toolCallId: row.tool_call_id ?? row.id,
        toolName: row.tool_name ?? "tool",
        argsText: row.tool_args_text ?? "",
        resultText: row.tool_result_text,
        isError: row.tool_is_error === 1,
        parentPartId: row.parent_part_id,
      };
  }
};

const inferThreadTitle = (prompt: string): string => {
  const compact = prompt.replace(/\s+/g, " ").trim();

  if (compact.length <= 48) {
    return compact;
  }

  return `${compact.slice(0, 45)}...`;
};

const getMessageMetadataJson = (): string =>
  JSON.stringify(
    jsonRecordSchema.parse({
      custom: {},
    }),
  );

const touchThread = async (
  threadId: string,
  lastMessageAt: string | null,
): Promise<void> => {
  const db = await getMetadataDatabase();
  const now = getTimestamp();

  await db
    .updateTable("chat_threads")
    .set({
      updated_at: now,
      last_used_at: now,
      ...(lastMessageAt === null ? {} : { last_message_at: lastMessageAt }),
    })
    .where("id", "=", threadId)
    .execute();
};

const getNextSequenceNo = async (threadId: string): Promise<number> => {
  const db = await getMetadataDatabase();
  const result = await db
    .selectFrom("chat_messages")
    .select((eb) => eb.fn.max<number>("sequence_no").as("max_sequence"))
    .where("thread_id", "=", threadId)
    .executeTakeFirst();

  return (result?.max_sequence ?? 0) + 1;
};

const insertMessageParts = async (
  messageId: string,
  parts: readonly ChatMessagePartInput[],
): Promise<readonly ChatMessagePart[]> => {
  const db = await getMetadataDatabase();
  const persistedParts: ChatMessagePart[] = [];

  for (const [ordinal, part] of parts.entries()) {
    const id = crypto.randomUUID();
    persistedParts.push({ ...part, id } as ChatMessagePart);

    switch (part.type) {
      case "text":
      case "reasoning":
        await db
          .insertInto("chat_message_parts")
          .values({
            id,
            message_id: messageId,
            ordinal,
            part_type: part.type,
            parent_part_id: part.parentPartId,
            text_value: part.text,
            image_path: null,
            file_path: null,
            filename: null,
            mime_type: null,
            data_name: null,
            data_json: null,
            tool_call_id: null,
            tool_name: null,
            tool_args_text: null,
            tool_result_text: null,
            tool_is_error: null,
          })
          .execute();
        break;
      case "image":
        await db
          .insertInto("chat_message_parts")
          .values({
            id,
            message_id: messageId,
            ordinal,
            part_type: "image",
            parent_part_id: null,
            text_value: null,
            image_path: part.imagePath,
            file_path: null,
            filename: part.filename,
            mime_type: null,
            data_name: null,
            data_json: null,
            tool_call_id: null,
            tool_name: null,
            tool_args_text: null,
            tool_result_text: null,
            tool_is_error: null,
          })
          .execute();
        break;
      case "file":
        await db
          .insertInto("chat_message_parts")
          .values({
            id,
            message_id: messageId,
            ordinal,
            part_type: "file",
            parent_part_id: null,
            text_value: null,
            image_path: null,
            file_path: part.filePath,
            filename: part.filename,
            mime_type: part.mimeType,
            data_name: null,
            data_json: null,
            tool_call_id: null,
            tool_name: null,
            tool_args_text: null,
            tool_result_text: null,
            tool_is_error: null,
          })
          .execute();
        break;
      case "data":
        await db
          .insertInto("chat_message_parts")
          .values({
            id,
            message_id: messageId,
            ordinal,
            part_type: "data",
            parent_part_id: null,
            text_value: null,
            image_path: null,
            file_path: null,
            filename: null,
            mime_type: null,
            data_name: part.name,
            data_json: part.dataJson,
            tool_call_id: null,
            tool_name: null,
            tool_args_text: null,
            tool_result_text: null,
            tool_is_error: null,
          })
          .execute();
        break;
      case "tool-call":
        await db
          .insertInto("chat_message_parts")
          .values({
            id,
            message_id: messageId,
            ordinal,
            part_type: "tool-call",
            parent_part_id: part.parentPartId,
            text_value: null,
            image_path: null,
            file_path: null,
            filename: null,
            mime_type: null,
            data_name: null,
            data_json: null,
            tool_call_id: part.toolCallId,
            tool_name: part.toolName,
            tool_args_text: part.argsText,
            tool_result_text: part.resultText,
            tool_is_error: part.isError ? 1 : 0,
          })
          .execute();
        break;
    }
  }

  return persistedParts;
};

const insertMessage = async ({
  threadId,
  role,
  runId,
  status,
  parts,
}: {
  threadId: string;
  role: "user" | "assistant" | "system";
  runId: string | null;
  status: ChatMessageStatus | null;
  parts: readonly ChatMessagePartInput[];
}): Promise<ChatMessage> => {
  const db = await getMetadataDatabase();
  const id = crypto.randomUUID();
  const sequenceNo = await getNextSequenceNo(threadId);
  const now = getTimestamp();

  await db
    .insertInto("chat_messages")
    .values({
      id,
      thread_id: threadId,
      role,
      sequence_no: sequenceNo,
      run_id: runId,
      status_type: status?.type ?? null,
      status_reason: status?.reason ?? null,
      error_json: status?.errorJson ?? null,
      metadata_json: getMessageMetadataJson(),
      created_at: now,
      updated_at: now,
    })
    .execute();

  const persistedParts = await insertMessageParts(id, parts);
  await touchThread(threadId, now);

  return chatMessageSchema.parse({
    id,
    threadId,
    role,
    runId,
    createdAt: now,
    updatedAt: now,
    status,
    parts: persistedParts,
  });
};

export const createChatThread = async (
  projectId: string,
  title: string | null = null,
): Promise<ChatThreadSummary> => {
  const db = await getMetadataDatabase();
  const id = crypto.randomUUID();
  const now = getTimestamp();

  await db
    .insertInto("chat_threads")
    .values({
      id,
      project_id: projectId,
      codex_thread_id: null,
      title,
      status: "regular",
      created_at: now,
      updated_at: now,
      last_used_at: now,
      last_message_at: null,
    })
    .execute();

  await db
    .insertInto("project_chat_state")
    .values({
      project_id: projectId,
      active_thread_id: id,
    })
    .onConflict((oc) =>
      oc.column("project_id").doUpdateSet({
        active_thread_id: id,
      }),
    )
    .execute();

  return buildThreadSummary({
    id,
    project_id: projectId,
    codex_thread_id: null,
    title,
    status: "regular",
    created_at: now,
    updated_at: now,
    last_used_at: now,
    last_message_at: null,
  });
};

export const listChatThreads = async (
  projectId: string,
): Promise<readonly ChatThreadSummary[]> => {
  const db = await getMetadataDatabase();
  const rows = (await db
    .selectFrom("chat_threads")
    .selectAll()
    .where("project_id", "=", projectId)
    .where("status", "=", "regular")
    .orderBy("last_used_at", "desc")
    .execute()) as ChatThreadRow[];

  return rows.map(buildThreadSummary);
};

export const setActiveChatThread = async (
  projectId: string,
  threadId: string,
): Promise<void> => {
  const db = await getMetadataDatabase();

  await db
    .insertInto("project_chat_state")
    .values({
      project_id: projectId,
      active_thread_id: threadId,
    })
    .onConflict((oc) =>
      oc.column("project_id").doUpdateSet({
        active_thread_id: threadId,
      }),
    )
    .execute();

  await touchThread(threadId, null);
};

export const getActiveChatThreadId = async (
  projectId: string,
): Promise<string | null> => {
  const db = await getMetadataDatabase();
  const state = await db
    .selectFrom("project_chat_state")
    .select("active_thread_id")
    .where("project_id", "=", projectId)
    .executeTakeFirst();

  return state?.active_thread_id ?? null;
};

export const getChatThreadSummary = async (
  threadId: string,
): Promise<ChatThreadSummary | null> => {
  const db = await getMetadataDatabase();
  const row = (await db
    .selectFrom("chat_threads")
    .selectAll()
    .where("id", "=", threadId)
    .executeTakeFirst()) as ChatThreadRow | undefined;

  return row ? buildThreadSummary(row) : null;
};

export const getChatThreadDetail = async (
  projectId: string,
  threadId: string,
): Promise<ChatThreadDetail> => {
  const db = await getMetadataDatabase();
  const row = (await db
    .selectFrom("chat_threads")
    .selectAll()
    .where("id", "=", threadId)
    .where("project_id", "=", projectId)
    .executeTakeFirst()) as ChatThreadRow | undefined;

  if (row === undefined) {
    throw new Error("Chat thread not found.");
  }

  const messageRows = (await db
    .selectFrom("chat_messages")
    .select([
      "id",
      "thread_id",
      "role",
      "run_id",
      "status_type",
      "status_reason",
      "error_json",
      "created_at",
      "updated_at",
    ])
    .where("thread_id", "=", threadId)
    .orderBy("sequence_no", "asc")
    .execute()) as ChatMessageRow[];

  const messageIds = messageRows.map((message) => message.id);
  const partRows =
    messageIds.length === 0
      ? []
      : ((await db
          .selectFrom("chat_message_parts")
          .selectAll()
          .where("message_id", "in", messageIds)
          .orderBy("ordinal", "asc")
          .execute()) as ChatPartRow[]);
  const partsByMessage = new Map<string, ChatMessagePart[]>();

  for (const rowPart of partRows) {
    const nextParts = partsByMessage.get(rowPart.message_id) ?? [];
    nextParts.push(buildMessagePart(rowPart));
    partsByMessage.set(rowPart.message_id, nextParts);
  }

  const messages = messageRows.map((message) =>
    chatMessageSchema.parse({
      id: message.id,
      threadId: message.thread_id,
      role: message.role,
      runId: message.run_id,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
      status: buildMessageStatus(message),
      parts: partsByMessage.get(message.id) ?? [],
    }),
  );

  return chatThreadDetailSchema.parse({
    thread: buildThreadSummary(row),
    messages,
  });
};

export const getOrCreateActiveChatThread = async (
  projectId: string,
): Promise<ChatThreadDetail> => {
  const activeThreadId = await getActiveChatThreadId(projectId);

  if (activeThreadId !== null) {
    try {
      return await getChatThreadDetail(projectId, activeThreadId);
    } catch {
      // Fall through and recreate the missing active thread.
    }
  }

  const existingThread = (await listChatThreads(projectId))[0];

  if (existingThread !== undefined) {
    await setActiveChatThread(projectId, existingThread.id);
    return getChatThreadDetail(projectId, existingThread.id);
  }

  const thread = await createChatThread(projectId);
  return getChatThreadDetail(projectId, thread.id);
};

export const appendUserPrompt = async (
  threadId: string,
  prompt: string,
): Promise<ChatMessage> => {
  const db = await getMetadataDatabase();
  const thread = await getChatThreadSummary(threadId);

  if (thread === null) {
    throw new Error("Chat thread not found.");
  }

  const message = await insertMessage({
    threadId,
    role: "user",
    runId: null,
    status: null,
    parts: [
      {
        type: "text",
        text: prompt,
        parentPartId: null,
      },
    ],
  });

  if (thread.title === null) {
    await db
      .updateTable("chat_threads")
      .set({
        title: inferThreadTitle(prompt),
      })
      .where("id", "=", threadId)
      .execute();
  }

  return message;
};

export const appendSystemTextMessage = async (
  threadId: string,
  text: string,
): Promise<ChatMessage> =>
  insertMessage({
    threadId,
    role: "system",
    runId: null,
    status: null,
    parts: [
      {
        type: "text",
        text,
        parentPartId: null,
      },
    ],
  });

export const appendAssistantMessage = async ({
  threadId,
  runId,
  status,
  parts,
}: {
  threadId: string;
  runId: string | null;
  status: ChatMessageStatus;
  parts: readonly ChatMessagePartInput[];
}): Promise<ChatMessage> =>
  insertMessage({
    threadId,
    role: "assistant",
    runId,
    status,
    parts,
  });

export const createChatRun = async ({
  threadId,
  projectId,
  kind,
  triggerMessageId,
}: {
  threadId: string;
  projectId: string;
  kind: ChatRunKind;
  triggerMessageId: string | null;
}): Promise<string> => {
  const db = await getMetadataDatabase();
  const runId = crypto.randomUUID();
  const now = getTimestamp();
  const thread = await getChatThreadSummary(threadId);

  await db
    .insertInto("chat_runs")
    .values({
      id: runId,
      thread_id: threadId,
      project_id: projectId,
      codex_thread_id: thread?.codexThreadId ?? null,
      kind,
      trigger_message_id: triggerMessageId,
      result_message_id: null,
      status: "running",
      input_tokens: null,
      cached_input_tokens: null,
      output_tokens: null,
      error_message: null,
      started_at: now,
      completed_at: null,
    })
    .execute();

  return runId;
};

export const appendChatRunItem = async ({
  runId,
  codexItemId,
  ordinal,
  itemType,
  status,
  payload,
}: {
  runId: string;
  codexItemId: string | null;
  ordinal: number;
  itemType: ChatRunItemType;
  status: string | null;
  payload: unknown;
}): Promise<void> => {
  const db = await getMetadataDatabase();

  await db
    .insertInto("chat_run_items")
    .values({
      id: crypto.randomUUID(),
      run_id: runId,
      codex_item_id: codexItemId,
      ordinal,
      item_type: itemType,
      status,
      payload_json: JSON.stringify(payload),
      created_at: getTimestamp(),
    })
    .execute();
};

export const completeChatRun = async ({
  runId,
  codexThreadId,
  resultMessageId,
  usage,
}: {
  runId: string;
  codexThreadId: string | null;
  resultMessageId: string | null;
  usage: {
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
  } | null;
}): Promise<void> => {
  const db = await getMetadataDatabase();
  const run = await db
    .selectFrom("chat_runs")
    .select(["thread_id"])
    .where("id", "=", runId)
    .executeTakeFirstOrThrow();

  await db
    .updateTable("chat_runs")
    .set({
      codex_thread_id: codexThreadId,
      result_message_id: resultMessageId,
      status: "completed",
      input_tokens: usage?.inputTokens ?? null,
      cached_input_tokens: usage?.cachedInputTokens ?? null,
      output_tokens: usage?.outputTokens ?? null,
      completed_at: getTimestamp(),
    })
    .where("id", "=", runId)
    .execute();

  if (codexThreadId !== null) {
    await db
      .updateTable("chat_threads")
      .set({
        codex_thread_id: codexThreadId,
      })
      .where("id", "=", run.thread_id)
      .execute();
  }
};

export const updateChatRunStatus = async ({
  runId,
  status,
  errorMessage,
}: {
  runId: string;
  status: Exclude<ChatRunStatus, "completed" | "running">;
  errorMessage: string | null;
}): Promise<void> => {
  const db = await getMetadataDatabase();

  await db
    .updateTable("chat_runs")
    .set({
      status,
      error_message: errorMessage,
      completed_at: getTimestamp(),
    })
    .where("id", "=", runId)
    .execute();
};

export const getChatThreadSession = async (
  threadId: string,
): Promise<{ projectId: string; codexThreadId: string | null } | null> => {
  const db = await getMetadataDatabase();
  const row = await db
    .selectFrom("chat_threads")
    .select(["project_id", "codex_thread_id"])
    .where("id", "=", threadId)
    .executeTakeFirst();

  if (row === undefined) {
    return null;
  }

  return {
    projectId: row.project_id,
    codexThreadId: row.codex_thread_id,
  };
};

export const deleteChatThread = async (
  projectId: string,
  threadId: string,
): Promise<void> => {
  const db = await getMetadataDatabase();
  const thread = await db
    .selectFrom("chat_threads")
    .select(["id"])
    .where("id", "=", threadId)
    .where("project_id", "=", projectId)
    .executeTakeFirst();

  if (thread === undefined) {
    throw new Error("Chat thread not found.");
  }

  const messageRows = await db
    .selectFrom("chat_messages")
    .select(["id"])
    .where("thread_id", "=", threadId)
    .execute();
  const messageIds = messageRows.map((message) => message.id);
  const runRows = await db
    .selectFrom("chat_runs")
    .select(["id"])
    .where("thread_id", "=", threadId)
    .execute();
  const runIds = runRows.map((run) => run.id);

  if (messageIds.length > 0) {
    await db
      .deleteFrom("chat_attachments")
      .where("message_id", "in", messageIds)
      .execute();
    await db
      .deleteFrom("chat_message_parts")
      .where("message_id", "in", messageIds)
      .execute();
  }

  if (runIds.length > 0) {
    await db
      .deleteFrom("chat_run_items")
      .where("run_id", "in", runIds)
      .execute();
  }

  await db
    .deleteFrom("chat_messages")
    .where("thread_id", "=", threadId)
    .execute();
  await db.deleteFrom("chat_runs").where("thread_id", "=", threadId).execute();
  await db.deleteFrom("chat_threads").where("id", "=", threadId).execute();

  const chatState = await db
    .selectFrom("project_chat_state")
    .select("active_thread_id")
    .where("project_id", "=", projectId)
    .executeTakeFirst();

  if (chatState?.active_thread_id === threadId) {
    await db
      .updateTable("project_chat_state")
      .set({
        active_thread_id: null,
      })
      .where("project_id", "=", projectId)
      .execute();
  }
};
