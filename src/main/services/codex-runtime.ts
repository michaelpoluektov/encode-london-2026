import { Codex } from "@openai/codex-sdk";
import type {
  ChatAttachPreviewContextResult,
  FileChangeInfo,
} from "../../shared/contracts";
import {
  type CodexRuntimeState,
  codexRuntimeSchema,
} from "../../shared/contracts";

const codex = new Codex();

type CodexThread = ReturnType<typeof codex.startThread>;

let activeThread: CodexThread | null = null;
let activeAbortController: AbortController | null = null;

const PREVIEW_CONTEXT_PROMPT =
  "This attached 200x200 image is the current shader preview after your last changes. " +
  "Compare it against your intended result. If you see a clear, confident improvement " +
  "you can make now, edit the relevant files. If it already looks right or you are not " +
  "confident what to change, do not modify files. Keep any edits small and focused, then " +
  "briefly summarize whether you changed anything.";

export const getCodexRuntimeState = (): CodexRuntimeState =>
  codexRuntimeSchema.parse({
    available: typeof Codex === "function",
    mode: "placeholder",
  });

export const startSession = (folderPath: string): void => {
  disposeSession();
  activeThread = codex.startThread({
    workingDirectory: folderPath,
    skipGitRepoCheck: true,
    sandboxMode: "workspace-write",
    approvalPolicy: "never",
  });
};

export const abortActiveTurn = (): void => {
  activeAbortController?.abort();
  activeAbortController = null;
};

export const disposeSession = (): void => {
  abortActiveTurn();
  activeThread = null;
};

export const sendMessage = async (
  prompt: string,
  onChunk: (text: string) => void,
  onFileChange: (changes: FileChangeInfo[]) => void,
): Promise<string> => {
  if (!activeThread) throw new Error("No active Codex session");

  let finalText = "";
  const abortController = new AbortController();
  activeAbortController = abortController;

  try {
    const { events } = await activeThread.runStreamed(prompt, {
      signal: abortController.signal,
    });

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

      if (event.type === "turn.failed") {
        throw new Error(event.error.message);
      }

      if (event.type === "error") {
        throw new Error(event.message);
      }

      if (event.type === "turn.completed") {
        break;
      }
    }
  } finally {
    if (activeAbortController === abortController) {
      activeAbortController = null;
    }
  }

  return finalText;
};

export const attachPreviewContext = async (
  imagePath: string,
  onFileChange: (changes: FileChangeInfo[]) => void,
): Promise<ChatAttachPreviewContextResult> => {
  if (!activeThread) throw new Error("No active Codex session");

  const abortController = new AbortController();
  activeAbortController = abortController;
  let appliedChanges = false;
  let finalText = "";

  try {
    const { events } = await activeThread.runStreamed(
      [
        { type: "text", text: PREVIEW_CONTEXT_PROMPT },
        { type: "local_image", path: imagePath },
      ],
      {
        signal: abortController.signal,
      },
    );

    for await (const event of events) {
      if (
        (event.type === "item.updated" || event.type === "item.completed") &&
        event.item.type === "agent_message"
      ) {
        finalText = event.item.text;
      }

      if (
        event.type === "item.completed" &&
        event.item.type === "file_change"
      ) {
        appliedChanges = true;
        onFileChange(event.item.changes);
      }

      if (event.type === "turn.failed") {
        throw new Error(event.error.message);
      }

      if (event.type === "error") {
        throw new Error(event.message);
      }

      if (event.type === "turn.completed") {
        break;
      }
    }
  } finally {
    if (activeAbortController === abortController) {
      activeAbortController = null;
    }
  }

  return {
    appliedChanges,
    responseText: finalText,
  };
};

export const hasActiveSession = (): boolean => activeThread !== null;
