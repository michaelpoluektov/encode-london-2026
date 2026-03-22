import {
  AssistantRuntimeProvider,
  MessagePrimitive,
  ThreadPrimitive,
  type ToolCallMessagePartProps,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { DomScrollableElement } from "monaco-editor/esm/vs/base/browser/ui/scrollbar/scrollableElement.js";
import {
  type JSX,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
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
  chatInputFieldSlot,
  chatInputLoadingField,
  chatLoadingDot,
  chatLoadingSpinner,
  chatMarkdown,
  chatMessageBody,
  chatMessageBubbleAssistant,
  chatMessageBubbleUser,
  chatMessageRow,
  chatMessages,
  chatMessagesViewport,
  chatPanel,
  chatPartBlock,
  chatPartPre,
  chatPartReasoning,
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
  chatToolCallTable,
  chatToolCallTableHeader,
  chatToolCallTableKey,
  chatToolCallTableRow,
  chatToolCallTableValue,
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

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  check_compilation: "Check compilation",
  render_preview: "Render preview",
  render_subgraph: "Render subgraph",
};

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

  if (
    (toolName === "render_preview" || toolName === "render_subgraph") &&
    isDataImageUrl(result)
  ) {
    return (
      <div className={chatToolCallSection}>
        <img alt="Shader preview" className={chatToolCallImage} src={result} />
      </div>
    );
  }

  if (toolName === "check_compilation" && typeof result === "string") {
    const ok = !isError;
    return (
      <Text as="span" tone={ok ? "secondary" : "accent"} variant="caption">
        {result}
      </Text>
    );
  }

  return (
    <pre
      className={`${chatToolCallPre}${isError === true ? ` ${chatToolCallError}` : ""}`}
    >
      {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
    </pre>
  );
};

const ToolCallBlock = (props: ToolCallMessagePartProps): JSX.Element => {
  let parsedArgs: Record<string, unknown> | null = null;
  if (props.argsText && props.argsText !== "{}") {
    try {
      parsedArgs = JSON.parse(props.argsText) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }
  const hasArgs = parsedArgs !== null && Object.keys(parsedArgs).length > 0;
  const displayName = TOOL_DISPLAY_NAMES[props.toolName] ?? props.toolName;

  return (
    <div className={chatToolCallBlock}>
      <div className={chatToolCallHeader}>
        <span className={chatToolCallName}>{displayName}</span>
        {props.isError === true && (
          <Text as="span" tone="accent" variant="caption">
            error
          </Text>
        )}
      </div>
      {hasArgs && parsedArgs !== null && (
        <table className={chatToolCallTable}>
          <thead>
            <tr>
              <th className={chatToolCallTableHeader}>Name</th>
              <th className={chatToolCallTableHeader}>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(parsedArgs).map(([key, val]) => (
              <tr key={key} className={chatToolCallTableRow}>
                <td className={chatToolCallTableKey}>{key}</td>
                <td className={chatToolCallTableValue}>
                  {typeof val === "string" ? val : JSON.stringify(val)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!hasArgs && props.argsText && props.argsText !== "{}" && (
        <pre className={chatToolCallPre}>{props.argsText}</pre>
      )}
      <ToolCallResult
        toolName={props.toolName}
        result={props.result}
        isError={props.isError}
      />
    </div>
  );
};

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

const AssistantMessageBubble = (): JSX.Element => {
  return (
    <div className={chatMessageRow}>
      <div className={chatMessageBubbleAssistant}>
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

export const ChatPanel = ({
  headerActions = null,
}: {
  readonly headerActions?: ReactNode;
}): JSX.Element => {
  const viewportHostRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const monacoViewportRef = useRef<DomScrollableElement | null>(null);
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

  useLayoutEffect(() => {
    const host = viewportHostRef.current;
    const viewport = viewportRef.current;

    if (
      host === null ||
      viewport === null ||
      monacoViewportRef.current !== null
    ) {
      return;
    }

    const scrollable = new DomScrollableElement(viewport, {
      className: chatMessagesViewport,
      consumeMouseWheelIfScrollbarIsNeeded: true,
      horizontal: 2,
      horizontalScrollbarSize: 12,
      horizontalSliderSize: 12,
      useShadows: false,
      vertical: 1,
      verticalScrollbarSize: 14,
      verticalSliderSize: 14,
    });
    const wrapper = scrollable.getDomNode();
    const resizeObserver = new ResizeObserver(() => {
      scrollable.scanDomNode();
    });
    const mutationObserver = new MutationObserver(() => {
      scrollable.scanDomNode();
    });

    monacoViewportRef.current = scrollable;
    host.appendChild(wrapper);
    resizeObserver.observe(host);
    resizeObserver.observe(viewport);
    mutationObserver.observe(viewport, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    scrollable.scanDomNode();

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();

      if (viewport.parentElement === wrapper) {
        host.appendChild(viewport);
      }

      if (wrapper.parentElement === host) {
        host.removeChild(wrapper);
      }

      scrollable.dispose();
      monacoViewportRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    monacoViewportRef.current?.scanDomNode();
  });

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
                        <CloseIcon />
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
              <PlusIcon />
            </Button>
          </div>
          {headerActions}
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
          <div className={chatMessagesViewport} ref={viewportHostRef}>
            <ThreadPrimitive.Viewport
              className={chatMessages}
              ref={viewportRef}
            >
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
                    return <AssistantMessageBubble key={message.id} />;
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
          </div>
        )}

        <div className={chatInputArea}>
          <div className={chatInputFieldSlot}>
            {isTurnActive ? (
              <div
                aria-live="polite"
                className={chatInputLoadingField}
                role="status"
              >
                <div className={chatLoadingSpinner}>
                  {([0, 200, 400] as const).map((delay) => (
                    <span
                      key={delay}
                      className={chatLoadingDot}
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
                <Text as="span" tone="muted" variant="body">
                  Codex is responding...
                </Text>
              </div>
            ) : (
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
                disabled={!project || activeThread === null}
                rows={3}
              />
            )}
          </div>
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
