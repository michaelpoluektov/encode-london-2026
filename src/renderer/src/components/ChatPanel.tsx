import {
  AssistantRuntimeProvider,
  MessagePrimitive,
  ThreadPrimitive,
  type ToolCallMessagePartProps,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import {
  type JSX,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import remarkGfm from "remark-gfm";
import type { FileChangeInfo } from "../../../shared/contracts";
import { useChatStore } from "../store/chat-store";
import { useProjectStore } from "../store/project-store";
import {
  chatEmpty,
  chatFileChangeRow,
  chatFileChip,
  chatFileChipKind,
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
  chatToolCallBlock,
  chatToolCallError,
  chatToolCallHeader,
  chatToolCallName,
  chatToolCallPre,
  chatToolCallSection,
  chatToolCallSectionLabel,
  chatWarning,
} from "./chat-panel.css";
import { useChatRuntime } from "./chat-runtime-adapter";
import { Button } from "./ui/Button";
import { textareaField } from "./ui/field.css";
import { Text } from "./ui/Text";

// ─── File change chip ────────────────────────────────────────────────────────

const FILE_KIND_LABEL: Record<FileChangeInfo["kind"], string> = {
  add: "+",
  update: "~",
  delete: "-",
};

const getBasename = (path: string): string => {
  const normalized = path.replaceAll("\\", "/");
  return normalized.split("/").at(-1) ?? path;
};

const FileChangeChip = ({
  change,
}: {
  change: FileChangeInfo;
}): JSX.Element => (
  <span className={chatFileChip} title={change.path}>
    <span className={chatFileChipKind}>{FILE_KIND_LABEL[change.kind]}</span>
    {getBasename(change.path)}
  </span>
);

// ─── Tool call block ─────────────────────────────────────────────────────────

const ToolCallBlock = (props: ToolCallMessagePartProps): JSX.Element => (
  <div className={chatToolCallBlock}>
    <div className={chatToolCallHeader}>
      <span className={chatToolCallName}>{props.toolName}</span>
      {props.isError === true && (
        <Text as="span" tone="accent" variant="caption">
          error
        </Text>
      )}
    </div>
    {props.argsText && props.argsText !== "{}" && (
      <div className={chatToolCallSection}>
        <span className={chatToolCallSectionLabel}>Args</span>
        <pre className={chatToolCallPre}>{props.argsText}</pre>
      </div>
    )}
    {props.result !== undefined && (
      <div className={chatToolCallSection}>
        <span
          className={`${chatToolCallSectionLabel}${props.isError === true ? ` ${chatToolCallError}` : ""}`}
        >
          Result
        </span>
        <pre className={chatToolCallPre}>
          {typeof props.result === "string"
            ? props.result
            : JSON.stringify(props.result, null, 2)}
        </pre>
      </div>
    )}
  </div>
);

// ─── Message content renderers ───────────────────────────────────────────────

const AssistantText = (): JSX.Element => (
  <MarkdownTextPrimitive
    className={chatMarkdown}
    containerProps={{ className: chatPartBlock }}
    remarkPlugins={[remarkGfm]}
  />
);

const AssistantReasoning = ({
  text,
}: {
  text: string;
  status: { type: string };
}): JSX.Element => (
  <div className={chatPartReasoning}>
    <Text as="div" tone="secondary" variant="label">
      Reasoning
    </Text>
    <div className={chatPartPre}>{text}</div>
  </div>
);

// ─── Message bubbles ─────────────────────────────────────────────────────────

const UserMessage = (): JSX.Element => (
  <div className={chatMessageRow}>
    <div className={chatMessageBubbleUser}>
      <div className={chatMessageBody}>
        <MessagePrimitive.Content
          components={{
            Text: ({ text }) => <div className={chatPartBlock}>{text}</div>,
          }}
        />
      </div>
    </div>
  </div>
);

const AssistantMessageBubble = ({
  isStreaming,
}: {
  isStreaming: boolean;
}): JSX.Element => (
  <div className={chatMessageRow}>
    <div
      className={isStreaming ? chatStreamingBubble : chatMessageBubbleAssistant}
    >
      <div className={chatMessageBody}>
        <MessagePrimitive.Content
          components={{
            Text: AssistantText,
            Reasoning: AssistantReasoning,
            tools: {
              Fallback: ToolCallBlock,
            },
          }}
        />
      </div>
    </div>
  </div>
);

const SystemMessage = (): JSX.Element => (
  <div className={chatMessageRow}>
    <div className={chatSystemMessage}>
      <MessagePrimitive.Content
        components={{
          Text: ({ text }) => <>{text}</>,
        }}
      />
    </div>
  </div>
);

// ─── Thread management header ─────────────────────────────────────────────────

const getThreadLabel = (title: string | null, fallbackIndex: number): string =>
  title ?? `Thread ${fallbackIndex + 1}`;

// ─── Main panel ──────────────────────────────────────────────────────────────

export const ChatPanel = (): JSX.Element => {
  const {
    currentProjectId,
    threads,
    activeThread,
    messages,
    isGenerating,
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
  const runtime = useChatRuntime();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void hydrateProject(projectId);
  }, [hydrateProject, projectId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: these are intentional trigger conditions for scroll, not values used inside the callback
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, recentFileChanges.length, warningMessage]);

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
    <AssistantRuntimeProvider runtime={runtime}>
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
                        disabled={
                          isGenerating || currentProjectId !== projectId
                        }
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
                Ask Codex to edit your shaders. It can read and write files in
                the project.
              </Text>
            ) : (
              <Text as="p" tone="muted" variant="caption">
                Open a project to start a chat session.
              </Text>
            )}
          </div>
        ) : (
          <div className={chatMessages}>
            <ThreadPrimitive.Messages>
              {({ message }) => {
                if (message.role === "user") {
                  return <UserMessage key={message.id} />;
                }
                if (message.role === "assistant") {
                  return (
                    <AssistantMessageBubble
                      key={message.id}
                      isStreaming={message.id === "$$streaming"}
                    />
                  );
                }
                return <SystemMessage key={message.id} />;
              }}
            </ThreadPrimitive.Messages>

            {recentFileChanges.length > 0 && (
              <div className={chatFileChangeRow}>
                {recentFileChanges.map((change) => (
                  <FileChangeChip key={change.path} change={change} />
                ))}
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
    </AssistantRuntimeProvider>
  );
};
