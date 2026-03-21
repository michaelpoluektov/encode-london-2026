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
  useState,
} from "react";
import remarkGfm from "remark-gfm";
import type { FileChangeInfo } from "../../../shared/contracts";
import { getPathBasename } from "../../../shared/path-utils";
import { useChatStore } from "../store/chat-store";
import { useProjectStore } from "../store/project-store";
import { CheckpointDivider } from "./CheckpointDivider";
import {
  chatEmpty,
  chatError,
  chatFileChangeRow,
  chatFileChip,
  chatFileChipKind,
  chatHeader,
  chatInputArea,
  chatLoadingDot,
  chatLoadingSpinner,
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
  chatToolCallImage,
  chatToolCallName,
  chatToolCallPre,
  chatToolCallSection,
  chatToolCallSectionLabel,
  chatWarning,
} from "./chat-panel.css";
import { useChatRuntime } from "./chat-runtime-adapter";
import { Button } from "./ui/Button";
import { textareaField } from "./ui/field.css";
import { CloseIcon, PlusIcon } from "./ui/icons";
import { Text } from "./ui/Text";

// ─── File change chip ────────────────────────────────────────────────────────

const FILE_KIND_LABEL: Record<FileChangeInfo["kind"], string> = {
  add: "+",
  update: "~",
  delete: "-",
};

const FileChangeChip = ({
  change,
}: {
  change: FileChangeInfo;
}): JSX.Element => (
  <span className={chatFileChip} title={change.path}>
    <span className={chatFileChipKind}>{FILE_KIND_LABEL[change.kind]}</span>
    {getPathBasename(change.path)}
  </span>
);

// ─── Tool call block ─────────────────────────────────────────────────────────

const isDataImageUrl = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("data:image");

const ToolCallResult = ({
  toolName,
  result,
  isError,
}: {
  toolName: string;
  result: unknown;
  isError: boolean | undefined;
}): JSX.Element | null => {
  if (result === undefined) return null;

  if (toolName === "render_preview" && isDataImageUrl(result)) {
    return (
      <div className={chatToolCallSection}>
        <span className={chatToolCallSectionLabel}>Preview</span>
        <img alt="Shader preview" className={chatToolCallImage} src={result} />
      </div>
    );
  }

  if (toolName === "check_compilation" && typeof result === "string") {
    const ok = !isError;
    return (
      <div className={chatToolCallSection}>
        <span className={chatToolCallSectionLabel}>Result</span>
        <Text as="span" tone={ok ? "secondary" : "accent"} variant="caption">
          {ok ? "✓" : "✗"} {result}
        </Text>
      </div>
    );
  }

  return (
    <div className={chatToolCallSection}>
      <span
        className={`${chatToolCallSectionLabel}${isError === true ? ` ${chatToolCallError}` : ""}`}
      >
        Result
      </span>
      <pre className={chatToolCallPre}>
        {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
};

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
    <ToolCallResult
      toolName={props.toolName}
      result={props.result}
      isError={props.isError}
    />
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
}): JSX.Element => {
  return (
    <div className={chatMessageRow}>
      <div
        className={
          isStreaming ? chatStreamingBubble : chatMessageBubbleAssistant
        }
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
          {isStreaming && (
            <div className={chatLoadingSpinner}>
              {([0, 200, 400] as const).map((delay) => (
                <span
                  key={delay}
                  className={chatLoadingDot}
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
    checkpoints,
    isGenerating,
    isRetrying,
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
  const isTurnActive =
    project !== null && activeThread !== null && isGenerating;
  const runtime = useChatRuntime(isTurnActive);

  const [input, setInput] = useState("");

  useEffect(() => {
    void hydrateProject(projectId);
  }, [hydrateProject, projectId]);

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
    if (!prompt || isTurnActive || !project) return;
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
    messages.length > 0 || isTurnActive || warningMessage !== null;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <section className={chatPanel}>
        <div className={chatHeader}>
          <div className={chatThreadHeader}>
            {projectId === null ? (
              <Text as="p" tone="muted" variant="caption">
                Open a project to start a chat thread.
              </Text>
            ) : sortedThreads.length === 0 && activeThread === null ? (
              <Text as="p" tone="muted" variant="caption">
                Loading threads...
              </Text>
            ) : sortedThreads.length === 0 ? (
              <Text as="p" tone="muted" variant="caption">
                No chat threads yet.
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
                          isTurnActive || currentProjectId !== projectId
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
                          isTurnActive ||
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
                        <CloseIcon size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              disabled={projectId === null || isTurnActive}
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
              <PlusIcon size={10} />
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
          <ThreadPrimitive.Viewport className={chatMessages}>
            <ThreadPrimitive.Messages>
              {({ message }) => {
                if (message.role === "user") {
                  const checkpoint = checkpoints.find(
                    (cp) => cp.messageId === message.id,
                  );
                  return (
                    <>
                      {checkpoint !== undefined && (
                        <CheckpointDivider
                          key={`cp-${checkpoint.id}`}
                          checkpoint={checkpoint}
                        />
                      )}
                      <UserMessage key={message.id} />
                    </>
                  );
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

            {isRetrying && <div className={chatError}>Error, retrying</div>}
            {warningMessage !== null && (
              <div className={chatWarning}>{warningMessage}</div>
            )}
          </ThreadPrimitive.Viewport>
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
            disabled={!project || activeThread === null || isTurnActive}
            rows={1}
          />
          {isTurnActive ? (
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
