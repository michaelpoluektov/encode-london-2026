import {
  type JSX,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatStore } from "../store/chat-store";
import { useProjectStore } from "../store/project-store";
import {
  chatEmpty,
  chatFileChange,
  chatInputArea,
  chatMarkdown,
  chatMessageBubbleAssistant,
  chatMessageBubbleUser,
  chatMessageRow,
  chatMessages,
  chatPanel,
  chatStreamingBubble,
  chatSystemMessage,
  chatWarning,
} from "./chat-panel.css";
import { Button } from "./ui/Button";
import { textareaField } from "./ui/field.css";
import { Text } from "./ui/Text";

const AssistantBubble = ({
  content,
  className,
}: {
  content: string;
  className: string;
}): JSX.Element => (
  <div className={className}>
    <div className={chatMarkdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  </div>
);

export const ChatPanel = (): JSX.Element => {
  const {
    messages,
    isGenerating,
    streamingText,
    recentFileChanges,
    warningMessage,
    sendMessage,
    cancelGeneration,
  } = useChatStore();
  const project = useProjectStore((s) => s.project);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className={chatMessageRow}>
                <div className={chatMessageBubbleUser}>{msg.content}</div>
              </div>
            ) : msg.role === "system" ? (
              <div key={msg.id} className={chatMessageRow}>
                <div className={chatSystemMessage}>{msg.content}</div>
              </div>
            ) : (
              <div key={msg.id} className={chatMessageRow}>
                <AssistantBubble
                  content={msg.content}
                  className={chatMessageBubbleAssistant}
                />
              </div>
            ),
          )}

          {isGenerating && streamingText && (
            <div className={chatMessageRow}>
              <AssistantBubble
                content={streamingText}
                className={chatStreamingBubble}
              />
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
          placeholder={project ? "Message Codex..." : "Open a project first"}
          disabled={!project || isGenerating}
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
            disabled={!project || !input.trim()}
          >
            Send
          </Button>
        )}
      </div>
    </section>
  );
};
