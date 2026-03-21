import type { ThreadItem, Usage } from "@openai/codex-sdk";
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
  getChatThreadSession,
  updateChatRunStatus,
} from "./chat-persistence";
import { getProjectFolderPath } from "./project-metadata";

const codex = new Codex();

type CodexThread = ReturnType<typeof codex.startThread>;
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

const toAssistantParts = (
  finalText: string,
  reasoningTexts: readonly string[],
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

  if (finalText.trim().length > 0) {
    parts.push({
      type: "text",
      text: finalText,
      parentPartId: null,
    });
  }

  return parts;
};

const getOrCreateThreadSession = async (
  projectId: string,
  threadId: string,
): Promise<{ codexThreadId: string | null; thread: CodexThread }> => {
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
    };
  }

  const thread =
    session.codexThreadId === null
      ? codex.startThread({
          workingDirectory: folderPath,
          skipGitRepoCheck: true,
          sandboxMode: "workspace-write",
          approvalPolicy: "never",
        })
      : codex.resumeThread(session.codexThreadId, {
          workingDirectory: folderPath,
          skipGitRepoCheck: true,
          sandboxMode: "workspace-write",
          approvalPolicy: "never",
        });

  threadSessions.set(threadId, thread);

  return {
    codexThreadId: session.codexThreadId,
    thread,
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
  createTriggerMessage: () => Promise<string | null>;
}): Promise<{
  codexThreadId: string | null;
  finalText: string;
  resultMessageId: string | null;
  usage: Usage | null;
}> => {
  const triggerMessage = await createTriggerMessage();
  const runId = await createChatRun({
    threadId,
    projectId,
    kind,
    triggerMessageId: triggerMessage,
  });
  const { codexThreadId: initialThreadId, thread } =
    await getOrCreateThreadSession(projectId, threadId);
  let codexThreadId = initialThreadId;
  let finalText = "";
  let usage: Usage | null = null;
  let itemOrdinal = 0;
  const reasoningTexts: string[] = [];
  const abortController = new AbortController();
  activeTurn = {
    abortController,
    threadId,
  };

  try {
    const { events } = await thread.runStreamed(input, {
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

    const assistantParts = toAssistantParts(finalText, reasoningTexts);
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
    const incompleteParts = toAssistantParts(finalText, reasoningTexts);

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
  payload: { projectId: string; threadId: string; prompt: string },
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
    createTriggerMessage: async () => {
      const userMessage = await appendUserPrompt(
        payload.threadId,
        payload.prompt,
      );
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
