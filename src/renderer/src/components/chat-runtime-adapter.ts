import type { MessageStatus, ThreadMessageLike } from "@assistant-ui/core";
import type { ExternalStoreAdapter } from "@assistant-ui/react";
import { useExternalStoreRuntime } from "@assistant-ui/react";
import type {
  ChatMessage,
  ChatMessagePart,
  ChatMessageStatus,
} from "../../../shared/contracts";
import { useChatStore } from "../store/chat-store";

const convertStatus = (
  status: ChatMessageStatus | null,
): MessageStatus | undefined => {
  if (status === null) return undefined;
  switch (status.type) {
    case "running":
      return { type: "running" };
    case "complete":
      return { type: "complete", reason: "stop" };
    case "incomplete":
      return { type: "incomplete", reason: "cancelled" };
    case "requires-action":
      return { type: "running" };
  }
};

const safeParseJson = (text: string): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return {};
};

// ThreadMessageLike content part (subset we support)
type AuiContentPart =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | {
      type: "tool-call";
      toolCallId: string;
      toolName: string;
      argsText: string;
      args: Record<string, unknown>;
      result?: unknown;
      isError?: boolean;
    };

const convertPart = (part: ChatMessagePart): AuiContentPart => {
  switch (part.type) {
    case "text":
      return { type: "text", text: part.text };
    case "reasoning":
      return { type: "reasoning", text: part.text };
    case "tool-call":
      return {
        type: "tool-call",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        argsText: part.argsText,
        // Cast required: ReadonlyJSONObject is structurally compatible but
        // unknown index value needs narrowing that JSON.parse can't provide.
        args: safeParseJson(part.argsText) as Record<string, never>,
        result: part.resultText ?? undefined,
        isError: part.isError,
      };
    case "image":
      return {
        type: "text",
        text: `[Image: ${part.filename ?? part.imagePath}]`,
      };
    case "file":
      return {
        type: "text",
        text: `[File: ${part.filename ?? part.filePath}]`,
      };
    case "data":
      return { type: "text", text: `[${part.name}]` };
  }
};

const buildStreamingMessage = (
  threadId: string,
  text: string,
): ChatMessage => ({
  id: "$$streaming",
  threadId,
  role: "assistant",
  runId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: { type: "running", reason: null, errorJson: null },
  parts: [{ id: "$$streaming-text", type: "text", text, parentPartId: null }],
});

const convertMessage = (msg: ChatMessage): ThreadMessageLike => {
  const content =
    msg.role === "system"
      ? ((
          msg.parts.find((p) => p.type === "text") as
            | Extract<ChatMessagePart, { type: "text" }>
            | undefined
        )?.text ?? "")
      : msg.parts.map(convertPart);

  return {
    id: msg.id,
    role: msg.role,
    // The args field in tool-call parts is Record<string,unknown> which is
    // compatible with ReadonlyJSONObject at runtime but not statically.
    content: content as ThreadMessageLike["content"],
    createdAt: new Date(msg.createdAt),
    status: convertStatus(msg.status),
  };
};

type AuiAdapter = ExternalStoreAdapter<ChatMessage>;

export const useChatRuntime = (isTurnActive: boolean) => {
  const {
    messages,
    streamingText,
    activeThread,
    sendMessage,
    cancelGeneration,
  } = useChatStore();

  const allMessages: readonly ChatMessage[] =
    isTurnActive && activeThread !== null
      ? [...messages, buildStreamingMessage(activeThread.id, streamingText)]
      : messages;

  const adapter: AuiAdapter = {
    isRunning: isTurnActive,
    messages: allMessages,
    convertMessage,
    onNew: async (appendMsg) => {
      const textContent = appendMsg.content.find((c) => c.type === "text");
      if (textContent?.type === "text") {
        await sendMessage(textContent.text);
      }
    },
    onCancel: async () => {
      cancelGeneration();
    },
  };

  return useExternalStoreRuntime(adapter);
};
