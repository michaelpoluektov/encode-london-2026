import type { Thread, ThreadItem, Usage } from "@openai/codex-sdk";
import { Codex } from "@openai/codex-sdk";
import type {
  ChatMessagePartInput,
  FileChangeInfo,
} from "../../shared/contracts";
import {
  type CodexRuntimeState,
  codexRuntimeSchema,
} from "../../shared/contracts";
import {
  appendAssistantMessage,
  appendChatRunItem,
  appendUserPrompt,
  completeChatRun,
  createChatRun,
  getChatThreadDetail,
  getChatThreadSession,
  updateChatRunStatus,
} from "./chat-persistence";
import {
  createCheckpoint,
  getProjectFolderPath,
  saveCheckpointPreview,
} from "./project-metadata";
import { readProjectSnapshotFiles } from "./project-snapshot-files";

let _codex: Codex | null = null;
let _mcpPort: number | null = null;

const getCodex = (): Codex => {
  if (_codex === null) {
    _codex =
      _mcpPort !== null
        ? new Codex({
            config: {
              mcp_servers: {
                "shadily-tools": {
                  url: `http://127.0.0.1:${_mcpPort}/mcp`,
                },
              },
            },
          })
        : new Codex();
  }
  return _codex;
};

export const setMcpPort = (port: number): void => {
  _mcpPort = port;
  _codex = null; // force recreation with MCP config
};

type CodexThread = Thread;
type CodexInput = string;

type ActiveTurn = {
  readonly abortController: AbortController;
  readonly threadId: string;
};

const threadSessions = new Map<string, CodexThread>();
let activeTurn: ActiveTurn | null = null;

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.message.toLowerCase().includes("abort");

const getThreadItemStatus = (item: ThreadItem): string | null => {
  switch (item.type) {
    case "command_execution":
    case "file_change":
    case "mcp_tool_call":
      return item.status;
    default:
      return null;
  }
};

const toRunItemType = (item: ThreadItem): ThreadItem["type"] | "error" =>
  item.type;

const buildToolCallResultText = (
  item: Extract<ThreadItem, { type: "mcp_tool_call" }>,
): string | null => {
  const blocks = item.result?.content;
  if (!blocks?.length) {
    return item.error?.message ?? null;
  }
  const imageBlock = blocks.find((b) => b.type === "image");
  if (
    imageBlock !== undefined &&
    "data" in imageBlock &&
    typeof imageBlock.data === "string"
  ) {
    const mimeType =
      "mimeType" in imageBlock ? imageBlock.mimeType : "image/png";
    return `data:${mimeType ?? "image/png"};base64,${imageBlock.data}`;
  }
  const textBlocks = blocks.filter((b) => b.type === "text");
  const joined = textBlocks
    .map((b) => ("text" in b ? (b.text as string) : ""))
    .join("\n");
  return joined.length > 0 ? joined : null;
};

const toAssistantParts = (
  finalText: string,
  reasoningTexts: readonly string[],
  toolCallParts: readonly ChatMessagePartInput[],
): readonly ChatMessagePartInput[] => {
  const parts: ChatMessagePartInput[] = [];

  for (const reasoningText of reasoningTexts) {
    if (reasoningText.trim().length === 0) {
      continue;
    }

    parts.push({
      type: "reasoning",
      text: reasoningText,
      parentPartId: null,
    });
  }

  parts.push(...toolCallParts);

  if (finalText.trim().length > 0) {
    parts.push({
      type: "text",
      text: finalText,
      parentPartId: null,
    });
  }

  return parts;
};

const formatContextPart = (part: ChatMessagePartInput): string | null => {
  switch (part.type) {
    case "text":
      return part.text.trim().length > 0 ? part.text : null;
    case "reasoning":
      return part.text.trim().length > 0 ? `Reasoning:\n${part.text}` : null;
    case "tool-call": {
      const sections = [`Tool call: ${part.toolName}`];
      if (part.argsText.trim().length > 0 && part.argsText !== "{}") {
        sections.push(`Arguments:\n${part.argsText}`);
      }
      if (part.resultText?.trim().length) {
        sections.push(`Result:\n${part.resultText}`);
      }
      if (part.isError) {
        sections.push("Status: error");
      }
      return sections.join("\n");
    }
    case "image":
      return `Image attachment: ${part.filename ?? part.imagePath}`;
    case "file":
      return `File attachment: ${part.filename ?? part.filePath}`;
    case "data":
      return `Data attachment (${part.name}):\n${part.dataJson}`;
  }
};

const buildThreadContextTranscript = async (
  projectId: string,
  threadId: string,
  excludedMessageId: string | null,
): Promise<string | null> => {
  const detail = await getChatThreadDetail(projectId, threadId);
  const priorMessages = detail.messages.filter(
    (message) => message.id !== excludedMessageId,
  );

  if (priorMessages.length === 0) {
    return null;
  }

  const transcript = priorMessages
    .map((message) => {
      const header = `${message.role.toUpperCase()}:`;
      const body = message.parts
        .map((part) => formatContextPart(part))
        .filter((part): part is string => part !== null)
        .join("\n\n")
        .trim();

      return body.length > 0 ? `${header}\n${body}` : null;
    })
    .filter((entry): entry is string => entry !== null)
    .join("\n\n");

  return transcript.length > 0 ? transcript : null;
};

const buildTurnInput = async ({
  projectId,
  threadId,
  prompt,
  initialCodexThreadId,
  triggerMessageId,
}: {
  projectId: string;
  threadId: string;
  prompt: string;
  initialCodexThreadId: string | null;
  triggerMessageId: string | null;
}): Promise<string> => {
  if (initialCodexThreadId !== null) {
    return prompt;
  }

  const transcript = await buildThreadContextTranscript(
    projectId,
    threadId,
    triggerMessageId,
  );

  if (transcript === null) {
    return prompt;
  }

  return [
    "Use the following chat transcript as the authoritative conversation context. It matches the messages currently visible in the app UI.",
    "",
    "<chat_transcript>",
    transcript,
    "</chat_transcript>",
    "",
    "<current_user_message>",
    prompt,
    "</current_user_message>",
  ].join("\n");
};

const getOrCreateThreadSession = async (
  projectId: string,
  threadId: string,
): Promise<{
  codexThreadId: string | null;
  thread: CodexThread;
  folderPath: string;
}> => {
  const existingThread = threadSessions.get(threadId);
  const session = await getChatThreadSession(threadId);
  const folderPath = await getProjectFolderPath(projectId);

  if (session === null) {
    throw new Error("Chat thread not found.");
  }

  if (folderPath === null) {
    throw new Error(
      "Project folder was not found for the current chat thread.",
    );
  }

  if (existingThread !== undefined) {
    return {
      codexThreadId: session.codexThreadId,
      thread: existingThread,
      folderPath,
    };
  }

  const codexInstance = getCodex();
  const thread =
    session.codexThreadId === null
      ? codexInstance.startThread({
          workingDirectory: folderPath,
          skipGitRepoCheck: true,
          sandboxMode: "workspace-write",
          approvalPolicy: "never",
        })
      : codexInstance.resumeThread(session.codexThreadId, {
          workingDirectory: folderPath,
          skipGitRepoCheck: true,
          sandboxMode: "workspace-write",
          approvalPolicy: "never",
        });

  threadSessions.set(threadId, thread);

  return {
    codexThreadId: session.codexThreadId,
    thread,
    folderPath,
  };
};

const runCodexTurn = async ({
  projectId,
  threadId,
  input,
  onChunk,
  onFileChange,
  kind,
  createTriggerMessage,
}: {
  projectId: string;
  threadId: string;
  input: CodexInput;
  onChunk: ((text: string) => void) | null;
  onFileChange: (changes: FileChangeInfo[]) => void;
  kind: "prompt";
  createTriggerMessage: (folderPath: string) => Promise<string | null>;
}): Promise<{
  codexThreadId: string | null;
  finalText: string;
  resultMessageId: string | null;
  usage: Usage | null;
}> => {
  const {
    codexThreadId: initialThreadId,
    thread,
    folderPath,
  } = await getOrCreateThreadSession(projectId, threadId);
  const triggerMessage = await createTriggerMessage(folderPath);
  const inputWithContext = await buildTurnInput({
    projectId,
    threadId,
    prompt: input,
    initialCodexThreadId: initialThreadId,
    triggerMessageId: triggerMessage,
  });
  const runId = await createChatRun({
    threadId,
    projectId,
    kind,
    triggerMessageId: triggerMessage,
  });
  let codexThreadId = initialThreadId;
  let finalText = "";
  let usage: Usage | null = null;
  let itemOrdinal = 0;
  const reasoningTexts: string[] = [];
  const mcpToolCallParts: ChatMessagePartInput[] = [];
  const abortController = new AbortController();
  activeTurn = {
    abortController,
    threadId,
  };

  try {
    const { events } = await thread.runStreamed(inputWithContext, {
      signal: abortController.signal,
    });

    for await (const event of events) {
      switch (event.type) {
        case "thread.started":
          codexThreadId = event.thread_id;
          break;
        case "item.updated":
        case "item.completed":
          if (event.item.type === "agent_message") {
            finalText = event.item.text;
            onChunk?.(finalText);
          }

          if (
            event.type === "item.completed" &&
            event.item.type === "reasoning" &&
            event.item.text.trim().length > 0
          ) {
            reasoningTexts.push(event.item.text);
          }

          if (event.type === "item.completed") {
            await appendChatRunItem({
              runId,
              codexItemId: event.item.id,
              ordinal: itemOrdinal,
              itemType: toRunItemType(event.item),
              status: getThreadItemStatus(event.item),
              payload: event.item,
            });
            itemOrdinal += 1;
          }

          if (
            event.type === "item.completed" &&
            event.item.type === "mcp_tool_call"
          ) {
            mcpToolCallParts.push({
              type: "tool-call",
              toolCallId: event.item.id,
              toolName: event.item.tool,
              argsText: JSON.stringify(event.item.arguments ?? {}),
              resultText: buildToolCallResultText(event.item),
              isError: event.item.status === "failed",
              parentPartId: null,
            });
          }

          if (
            event.type === "item.completed" &&
            event.item.type === "file_change"
          ) {
            onFileChange(event.item.changes);
          }
          break;
        case "turn.completed":
          usage = event.usage;
          break;
        case "turn.failed":
          throw new Error(event.error.message);
        case "error":
          throw new Error(event.message);
        case "turn.started":
          break;
      }
    }

    const assistantParts = toAssistantParts(
      finalText,
      reasoningTexts,
      mcpToolCallParts,
    );
    const assistantMessage =
      assistantParts.length === 0
        ? null
        : await appendAssistantMessage({
            threadId,
            runId,
            status: {
              type: "complete",
              reason: "stop",
              errorJson: null,
            },
            parts: assistantParts,
          });

    await completeChatRun({
      runId,
      codexThreadId,
      resultMessageId: assistantMessage?.id ?? null,
      usage:
        usage === null
          ? null
          : {
              inputTokens: usage.input_tokens,
              cachedInputTokens: usage.cached_input_tokens,
              outputTokens: usage.output_tokens,
            },
    });

    return {
      codexThreadId,
      finalText,
      resultMessageId: assistantMessage?.id ?? null,
      usage,
    };
  } catch (error) {
    const incompleteParts = toAssistantParts(
      finalText,
      reasoningTexts,
      mcpToolCallParts,
    );

    if (incompleteParts.length > 0) {
      await appendAssistantMessage({
        threadId,
        runId,
        status: {
          type: "incomplete",
          reason: isAbortError(error) ? "cancelled" : "error",
          errorJson:
            error instanceof Error
              ? JSON.stringify({ message: error.message })
              : null,
        },
        parts: incompleteParts,
      });
    }

    await updateChatRunStatus({
      runId,
      status: isAbortError(error) ? "cancelled" : "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    if (activeTurn?.abortController === abortController) {
      activeTurn = null;
    }
  }
};

export const getCodexRuntimeState = (): CodexRuntimeState =>
  codexRuntimeSchema.parse({
    available: typeof Codex === "function",
    mode: "placeholder",
  });

export const abortActiveTurn = (): void => {
  activeTurn?.abortController.abort();
  activeTurn = null;
};

export const sendMessage = async (
  payload: {
    projectId: string;
    threadId: string;
    prompt: string;
    previewPath?: string | null;
    previewSnapshot?:
      | import("../../shared/contracts").GraphPreviewSnapshot
      | null;
    fragmentShaderSource?: string | null;
  },
  onChunk: (text: string) => void,
  onFileChange: (changes: FileChangeInfo[]) => void,
): Promise<void> => {
  await runCodexTurn({
    projectId: payload.projectId,
    threadId: payload.threadId,
    input: payload.prompt,
    onChunk,
    onFileChange,
    kind: "prompt",
    createTriggerMessage: async (folderPath) => {
      const userMessage = await appendUserPrompt(
        payload.threadId,
        payload.prompt,
      );

      // Snapshot files and create a checkpoint for this user message.
      try {
        const fileSnapshots = await readProjectSnapshotFiles(folderPath);
        let resolvedPreviewPath = payload.previewPath ?? null;

        // If the renderer sent a data URL instead of a path, save it to disk.
        if (resolvedPreviewPath?.startsWith("data:")) {
          resolvedPreviewPath = saveCheckpointPreview(
            folderPath,
            resolvedPreviewPath,
          );
        }

        await createCheckpoint({
          projectId: payload.projectId,
          threadId: payload.threadId,
          messageId: userMessage.id,
          fileSnapshotsJson: JSON.stringify(fileSnapshots),
          previewPath: resolvedPreviewPath,
          previewSnapshot: payload.previewSnapshot ?? null,
          fragmentShaderSource: payload.fragmentShaderSource ?? null,
        });
      } catch {
        // Non-fatal: proceed without checkpoint
      }

      return userMessage.id;
    },
  });
};

export const disposeSessions = (): void => {
  abortActiveTurn();
  threadSessions.clear();
};

export const disposeThreadSession = (threadId: string): void => {
  if (activeTurn?.threadId === threadId) {
    activeTurn.abortController.abort();
    activeTurn = null;
  }

  threadSessions.delete(threadId);
};
