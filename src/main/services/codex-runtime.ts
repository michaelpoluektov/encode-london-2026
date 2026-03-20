import { Codex } from "@openai/codex-sdk";
import {
  type CodexRuntimeState,
  codexRuntimeSchema,
} from "../../shared/contracts";
import type { FileChangeInfo } from "../../shared/contracts";

const codex = new Codex();

type CodexThread = ReturnType<typeof codex.startThread>;

let activeThread: CodexThread | null = null;
let activeAbortController: AbortController | null = null;

export const getCodexRuntimeState = (): CodexRuntimeState =>
  codexRuntimeSchema.parse({
    available: typeof Codex === "function",
    mode: "placeholder",
  });

export const startSession = (folderPath: string): void => {
  activeAbortController?.abort();
  activeThread = codex.startThread({
    workingDirectory: folderPath,
    skipGitRepoCheck: true,
    sandboxMode: "workspace-write",
    approvalPolicy: "never",
  });
};

export const stopSession = (): void => {
  activeAbortController?.abort();
  activeAbortController = null;
  activeThread = null;
};

export const sendMessage = async (
  prompt: string,
  onChunk: (text: string) => void,
  onFileChange: (changes: FileChangeInfo[]) => void,
): Promise<string> => {
  if (!activeThread) throw new Error("No active Codex session");

  activeAbortController = new AbortController();
  const { events } = await activeThread.runStreamed(prompt, {
    signal: activeAbortController.signal,
  });

  let finalText = "";

  for await (const event of events) {
    if (
      (event.type === "item.updated" || event.type === "item.completed") &&
      event.item.type === "agent_message"
    ) {
      finalText = event.item.text;
      onChunk(finalText);
    }

    if (
      event.type === "item.completed" &&
      event.item.type === "file_change"
    ) {
      onFileChange(event.item.changes);
    }

    if (event.type === "turn.completed" || event.type === "turn.failed") {
      break;
    }
  }

  activeAbortController = null;
  return finalText;
};

export const hasActiveSession = (): boolean => activeThread !== null;
