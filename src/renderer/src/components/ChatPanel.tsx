import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { AuiProvider, useAui } from "@assistant-ui/store";
import { resource, tapMemo } from "@assistant-ui/tap";
import {
  type JSX,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import remarkGfm from "remark-gfm";
import type { ChatMessage, ChatMessagePart } from "../../../shared/contracts";
import { useChatStore } from "../store/chat-store";
import { useProjectStore } from "../store/project-store";
import {
  chatEmpty,
  chatFileChange,
  chatHeader,
  chatInputArea,
  chatMarkdown,
  chatMessageBody,
  chatMessageBubbleAssistant,
  chatMessageBubbleUser,
  chatMessageRow,
  chatMessages,
  chatPanel,
  chatPartBlock,
  chatPartImage,
  chatPartLabel,
  chatPartPre,
  chatPartReasoning,
  chatStreamingBubble,
  chatSystemMessage,
  chatThreadButton,
  chatThreadButtonActive,
  chatThreadDeleteButton,
  chatThreadHeader,
  chatThreadList,
  chatThreadSelectButton,
  chatThreadTab,
  chatThreadTitle,
  chatWarning,
} from "./chat-panel.css";
import { Button } from "./ui/Button";
import { textareaField } from "./ui/field.css";
import { Text } from "./ui/Text";

const createUnsupportedOperation = (name: string): (() => never) => {
  return () => {
    throw new Error(`${name} is not supported in markdown preview scope.`);
  };
};

const MarkdownMessageClient = resource(
  ({ messageId }: { messageId: string }) => {
    const state = tapMemo(() => ({ id: messageId }) as never, [messageId]);
    const unsupported = createUnsupportedOperation("Message operation");
    const noop = (): void => {};

    return {
      getState: () => state,
      composer: unsupported,
      reload: unsupported,
      speak: unsupported,
      stopSpeaking: unsupported,
      submitFeedback: unsupported,
      switchToBranch: unsupported,
      getCopyText: () => "",
      part: unsupported,
      attachment: unsupported,
      setIsCopied: noop,
      setIsHovering: noop,
    };
  },
);

const MarkdownPartClient = resource(
  ({ text, isRunning }: { text: string; isRunning: boolean }) => {
    const state = tapMemo(
      () =>
        ({
          type: "text",
          text,
          status: isRunning ? { type: "running" } : { type: "complete" },
        }) as const,
      [isRunning, text],
    );
    const unsupported = createUnsupportedOperation("Part operation");

    return {
      getState: () => state,
      addToolResult: unsupported,
      resumeToolCall: unsupported,
    };
  },
);

const MarkdownTextScope = ({
  className,
  containerClassName,
  isRunning = false,
  messageId,
  text,
}: {
  className: string;
  containerClassName?: string;
  isRunning?: boolean;
  messageId: string;
  text: string;
}): JSX.Element => {
  const aui = useAui({
    message: MarkdownMessageClient({ messageId }),
    part: MarkdownPartClient({ isRunning, text }),
  } as never);

  return (
    <AuiProvider value={aui}>
      <MarkdownTextPrimitive
        className={className}
        containerProps={
          containerClassName === undefined
            ? undefined
            : {
                className: containerClassName,
              }
        }
        remarkPlugins={[remarkGfm]}
      />
    </AuiProvider>
  );
};

const renderMessagePart = (
  messageId: string,
  part: ChatMessagePart,
  role: ChatMessage["role"],
): JSX.Element => {
  switch (part.type) {
    case "text":
      return role === "assistant" ? (
        <MarkdownTextScope
          key={part.id}
          className={chatMarkdown}
          containerClassName={chatPartBlock}
          messageId={messageId}
          text={part.text}
        />
      ) : (
        <div key={part.id} className={chatPartBlock}>
          {part.text}
        </div>
      );
    case "reasoning":
      return (
        <div key={part.id} className={chatPartReasoning}>
          <Text as="div" tone="secondary" variant="label">
            Reasoning
          </Text>
          <div className={chatPartPre}>{part.text}</div>
        </div>
      );
    case "image":
      return (
        <div key={part.id} className={chatPartImage}>
          <Text as="div" tone="secondary" variant="label">
            Image
          </Text>
          <Text as="div" variant="code">
            {part.filename ?? part.imagePath}
          </Text>
          <Text as="div" tone="muted" variant="caption">
            {part.imagePath}
          </Text>
        </div>
      );
    case "file":
      return (
        <div key={part.id} className={chatPartImage}>
          <Text as="div" tone="secondary" variant="label">
            File
          </Text>
          <Text as="div" variant="code">
            {part.filename ?? part.filePath}
          </Text>
          <Text as="div" tone="muted" variant="caption">
            {part.filePath}
          </Text>
        </div>
      );
    case "data":
      return (
        <div key={part.id} className={chatPartImage}>
          <Text as="div" tone="secondary" variant="label">
            {part.name}
          </Text>
          <div className={chatPartPre}>{part.dataJson}</div>
        </div>
      );
    case "tool-call":
      return (
        <div key={part.id} className={chatPartImage}>
          <Text as="div" tone="secondary" variant="label">
            Tool
          </Text>
          <Text as="div" variant="code">
            {part.toolName}
          </Text>
          <Text
            as="div"
            className={chatPartLabel}
            tone="muted"
            variant="caption"
          >
            Arguments
          </Text>
          <div className={chatPartPre}>{part.argsText}</div>
          {part.resultText !== null ? (
            <>
              <Text
                as="div"
                className={chatPartLabel}
                tone={part.isError ? "accent" : "muted"}
                variant="caption"
              >
                Result
              </Text>
              <div className={chatPartPre}>{part.resultText}</div>
            </>
          ) : null}
        </div>
      );
  }
};

const MessageBubble = ({ message }: { message: ChatMessage }): JSX.Element => {
  const bubbleClassName =
    message.role === "assistant"
      ? chatMessageBubbleAssistant
      : message.role === "user"
        ? chatMessageBubbleUser
        : chatSystemMessage;

  return (
    <div className={chatMessageRow}>
      <div className={bubbleClassName}>
        <div className={chatMessageBody}>
          {message.parts.map((part) =>
            renderMessagePart(message.id, part, message.role),
          )}
        </div>
      </div>
    </div>
  );
};

const getThreadLabel = (title: string | null, fallbackIndex: number): string =>
  title ?? `Thread ${fallbackIndex + 1}`;

export const ChatPanel = (): JSX.Element => {
  const {
    currentProjectId,
    threads,
    activeThread,
    messages,
    isGenerating,
    streamingText,
    recentFileChanges,
    warningMessage,
    hydrateProject,
    createThread,
    switchThread,
    deleteThread,
    sendMessage,
    cancelGeneration,
  } = useChatStore();
  const project = useProjectStore((s) => s.project);
  const projectId = project?.manifest.projectId ?? null;

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void hydrateProject(projectId);
  }, [hydrateProject, projectId]);

  useEffect(() => {
    if (
      messages.length > 0 ||
      streamingText.length > 0 ||
      recentFileChanges.length > 0 ||
      warningMessage !== null
    ) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [
    messages.length,
    recentFileChanges.length,
    streamingText.length,
    warningMessage,
  ]);

  useEffect(() => {
    if (projectId === null) {
      setInput("");
    }
  }, [projectId]);

  const sortedThreads = useMemo(
    () =>
      [...threads].sort(
        (left, right) =>
          new Date(right.lastUsedAt).getTime() -
          new Date(left.lastUsedAt).getTime(),
      ),
    [threads],
  );
  const canDeleteThreads = sortedThreads.length > 1;

  const handleSend = () => {
    const prompt = input.trim();
    if (!prompt || isGenerating || !project) return;
    setInput("");
    void sendMessage(prompt);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent =
    messages.length > 0 || isGenerating || warningMessage !== null;

  return (
    <section className={chatPanel}>
      <div className={chatHeader}>
        <div className={chatThreadHeader}>
          {projectId === null ? (
            <Text as="p" tone="muted" variant="caption">
              Open a project to start a chat thread.
            </Text>
          ) : sortedThreads.length === 0 ? (
            <Text as="p" tone="muted" variant="caption">
              Loading threads...
            </Text>
          ) : (
            <div className={chatThreadList}>
              {sortedThreads.map((thread, index) => (
                <div key={thread.id} className={chatThreadTab}>
                  <div
                    className={
                      thread.id === activeThread?.id
                        ? `${chatThreadButton} ${chatThreadButtonActive}`
                        : chatThreadButton
                    }
                  >
                    <button
                      className={chatThreadSelectButton}
                      disabled={isGenerating || currentProjectId !== projectId}
                      onClick={() => {
                        if (
                          projectId === null ||
                          thread.id === activeThread?.id
                        ) {
                          return;
                        }

                        void switchThread(projectId, thread.id);
                      }}
                      type="button"
                    >
                      <span className={chatThreadTitle}>
                        {getThreadLabel(thread.title, index)}
                      </span>
                    </button>
                    <button
                      aria-label={`Delete ${getThreadLabel(thread.title, index)}`}
                      className={chatThreadDeleteButton}
                      disabled={
                        isGenerating ||
                        currentProjectId !== projectId ||
                        !canDeleteThreads
                      }
                      onClick={(event) => {
                        event.stopPropagation();

                        if (projectId === null) {
                          return;
                        }

                        void deleteThread(projectId, thread.id);
                      }}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            disabled={projectId === null || isGenerating}
            onClick={() => {
              if (projectId === null) {
                return;
              }

              void createThread(projectId);
            }}
            size="xs"
            square
            variant="plain"
          >
            +
          </Button>
        </div>
      </div>

      {!hasContent ? (
        <div className={chatEmpty}>
          {project ? (
            <Text as="p" tone="muted" variant="caption">
              Ask Codex to edit your shaders. It can read and write files in the
              project.
            </Text>
          ) : (
            <Text as="p" tone="muted" variant="caption">
              Open a project to start a chat session.
            </Text>
          )}
        </div>
      ) : (
        <div className={chatMessages}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isGenerating && streamingText && (
            <div className={chatMessageRow}>
              <div className={chatStreamingBubble}>
                <MarkdownTextScope
                  className={chatMarkdown}
                  isRunning
                  messageId="streaming-assistant-message"
                  text={streamingText}
                />
              </div>
            </div>
          )}

          {recentFileChanges.length > 0 && (
            <div className={chatFileChange}>
              {recentFileChanges.map((c) => `${c.kind} ${c.path}`).join("\n")}
            </div>
          )}

          {warningMessage !== null && (
            <div className={chatWarning}>{warningMessage}</div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <div className={chatInputArea}>
        <textarea
          className={textareaField}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            project && activeThread !== null
              ? "Message Codex..."
              : "Open a project first"
          }
          disabled={!project || activeThread === null || isGenerating}
          rows={1}
        />
        {isGenerating ? (
          <Button size="sm" variant="outline" onClick={cancelGeneration}>
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSend}
            disabled={!project || activeThread === null || !input.trim()}
          >
            Send
          </Button>
        )}
      </div>
    </section>
  );
};
