import { create } from "zustand";
import type { ChatMessage, FileChangeInfo } from "../../../shared/contracts";
import { captureRegisteredPreview } from "../preview-capture";
import { useProjectStore } from "./project-store";

let chunkUnsubscribe: (() => void) | null = null;
let fileChangeUnsubscribe: (() => void) | null = null;
let pendingShaderReload: Promise<void> = Promise.resolve();

const MAX_PREVIEW_FOLLOW_UPS = 3;

const PREFLIGHT_PROMPT =
  "Read every file in this project directory and understand what is here. " +
  "Then give a concise summary: what the shaders do, what visual effect they produce, " +
  "and anything else worth knowing about this project.";

const waitForAnimationFrame = async (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.message.toLowerCase().includes("abort");

const resetPendingShaderReload = (): void => {
  pendingShaderReload = Promise.resolve();
};

const waitForPendingShaderReload = async (): Promise<void> => {
  await pendingShaderReload.catch(() => undefined);
};

const reloadTouchedShaders = async (
  changes: FileChangeInfo[],
): Promise<void> => {
  const project = useProjectStore.getState().project;

  if (project === null) {
    return;
  }

  const shaderFiles = new Set([
    project.manifest.shaders.fragment,
    project.manifest.shaders.vertex,
  ]);
  const touched = changes.some((change) =>
    shaderFiles.has(change.path.split("/").pop() ?? change.path),
  );

  if (!touched) {
    return;
  }

  try {
    const fresh = await window.shadily.project.readShaders(
      project.folderPath,
      project.manifest,
    );

    useProjectStore.getState().updateShader("fragment", fresh.fragment);
    useProjectStore.getState().updateShader("vertex", fresh.vertex);
  } catch {
    // non-fatal — user can manually reload
  }
};

const queueShaderReload = (changes: FileChangeInfo[]): void => {
  pendingShaderReload = pendingShaderReload
    .catch(() => undefined)
    .then(async () => reloadTouchedShaders(changes));
};

const clearChatSubscriptions = (): void => {
  chunkUnsubscribe?.();
  chunkUnsubscribe = null;
  fileChangeUnsubscribe?.();
  fileChangeUnsubscribe = null;
};

const getImageLabel = (imagePath: string): string =>
  imagePath.split("/").pop() ?? imagePath;

const appendChatMessage = (
  setState: (
    partial:
      | Partial<ChatStore>
      | ((state: ChatStore) => Partial<ChatStore> | ChatStore),
  ) => void,
  message: ChatMessage,
): void => {
  setState((state) => ({ messages: [...state.messages, message] }));
};

const updateChatMessage = (
  setState: (
    partial:
      | Partial<ChatStore>
      | ((state: ChatStore) => Partial<ChatStore> | ChatStore),
  ) => void,
  messageId: string,
  content: string,
): void => {
  setState((state) => ({
    messages: state.messages.map((message) =>
      message.id === messageId ? { ...message, content } : message,
    ),
  }));
};

const runPreviewFollowUps = async (
  setState: (
    partial:
      | Partial<ChatStore>
      | ((state: ChatStore) => Partial<ChatStore> | ChatStore),
  ) => void,
): Promise<void> => {
  for (let iteration = 1; iteration <= MAX_PREVIEW_FOLLOW_UPS; iteration += 1) {
    const project = useProjectStore.getState().project;

    if (project === null) {
      return;
    }

    const statusMessageId = crypto.randomUUID();
    appendChatMessage(setState, {
      id: statusMessageId,
      role: "system",
      content: `Visual follow-up ${iteration}/${MAX_PREVIEW_FOLLOW_UPS}: capturing the current preview...`,
    });

    const captureDataUrl = await captureRegisteredPreview();

    if (captureDataUrl === null) {
      updateChatMessage(
        setState,
        statusMessageId,
        `Visual follow-up ${iteration}/${MAX_PREVIEW_FOLLOW_UPS}: preview capture was unavailable, so automatic refinement stopped.`,
      );
      return;
    }

    updateChatMessage(
      setState,
      statusMessageId,
      `Visual follow-up ${iteration}/${MAX_PREVIEW_FOLLOW_UPS}: sending the latest preview image to Codex...`,
    );

    try {
      const { imagePath } = await window.shadily.project.saveCapture({
        folderPath: project.folderPath,
        dataUrl: captureDataUrl,
      });
      const imageLabel = getImageLabel(imagePath);
      const result = await window.shadily.chat.attachPreviewContext(imagePath);

      await waitForPendingShaderReload();

      if (!result.appliedChanges) {
        updateChatMessage(
          setState,
          statusMessageId,
          `Visual follow-up ${iteration}/${MAX_PREVIEW_FOLLOW_UPS}: Codex reviewed ${imageLabel} and made no further code changes.`,
        );
        return;
      }

      if (iteration === MAX_PREVIEW_FOLLOW_UPS) {
        updateChatMessage(
          setState,
          statusMessageId,
          `Visual follow-up ${iteration}/${MAX_PREVIEW_FOLLOW_UPS}: Codex revised the code after reviewing ${imageLabel}. The automatic iteration cap was reached.`,
        );
        return;
      }

      updateChatMessage(
        setState,
        statusMessageId,
        `Visual follow-up ${iteration}/${MAX_PREVIEW_FOLLOW_UPS}: Codex revised the code after reviewing ${imageLabel}. Capturing another preview...`,
      );

      await waitForAnimationFrame();
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      updateChatMessage(
        setState,
        statusMessageId,
        `Visual follow-up ${iteration}/${MAX_PREVIEW_FOLLOW_UPS}: automatic refinement stopped because the preview review turn failed.`,
      );
      setState({
        warningMessage:
          error instanceof Error
            ? error.message
            : "The preview-guided follow-up turn failed.",
      });
      return;
    }
  }
};

type ChatStore = {
  readonly messages: ChatMessage[];
  readonly isGenerating: boolean;
  readonly isPreflighting: boolean;
  readonly streamingText: string;
  readonly recentFileChanges: FileChangeInfo[];
  readonly warningMessage: string | null;

  readonly sendMessage: (prompt: string) => Promise<void>;
  readonly runPreflight: () => Promise<void>;
  readonly cancelGeneration: () => void;
  readonly clearHistory: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isGenerating: false,
  isPreflighting: false,
  streamingText: "",
  recentFileChanges: [],
  warningMessage: null,

  sendMessage: async (prompt) => {
    if (get().isGenerating) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };

    set((s) => ({
      messages: [...s.messages, userMessage],
      isGenerating: true,
      streamingText: "",
      recentFileChanges: [],
      warningMessage: null,
    }));

    resetPendingShaderReload();
    clearChatSubscriptions();
    chunkUnsubscribe = window.shadily.chat.onChunk((text) => {
      set({ streamingText: text });
    });

    fileChangeUnsubscribe = window.shadily.chat.onFileChange((changes) => {
      set({ recentFileChanges: changes });
      queueShaderReload(changes);
    });

    try {
      await window.shadily.chat.send(prompt);

      const finalText = get().streamingText;
      if (finalText) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: finalText,
        };

        appendChatMessage(set, assistantMessage);
        set({ streamingText: "" });
      } else {
        set({ streamingText: "" });
      }

      await waitForPendingShaderReload();
      await waitForAnimationFrame();

      if (useProjectStore.getState().project !== null) {
        await runPreviewFollowUps(set);
      }

      set({ isGenerating: false, streamingText: "" });
    } catch (error) {
      if (!isAbortError(error)) {
        set({ warningMessage: "The Codex turn failed before completion." });
      }
      set({ isGenerating: false, streamingText: "" });
    } finally {
      clearChatSubscriptions();
      resetPendingShaderReload();
    }
  },

  runPreflight: async () => {
    // Clear history from any previous project and run a silent preflight turn.
    // We don't add a user bubble — this is an automatic background scan.
    set({
      messages: [],
      isGenerating: true,
      isPreflighting: true,
      streamingText: "",
      recentFileChanges: [],
      warningMessage: null,
    });

    resetPendingShaderReload();
    clearChatSubscriptions();
    chunkUnsubscribe = window.shadily.chat.onChunk((text) => {
      set({ streamingText: text });
    });

    fileChangeUnsubscribe = window.shadily.chat.onFileChange((changes) => {
      set({ recentFileChanges: changes });
      queueShaderReload(changes);
    });

    try {
      await window.shadily.chat.send(PREFLIGHT_PROMPT);
      await waitForPendingShaderReload();

      const summary = get().streamingText;
      if (summary) {
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: summary,
        };
        appendChatMessage(set, msg);
      }
    } catch {
      // non-fatal — user can still chat
    } finally {
      clearChatSubscriptions();
      resetPendingShaderReload();
      set({ isGenerating: false, isPreflighting: false, streamingText: "" });
    }
  },

  cancelGeneration: () => {
    window.shadily.chat.stop();
    const partial = useChatStore.getState().streamingText;
    if (partial) {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: partial,
      };
      appendChatMessage(set, msg);
    }
    set({ isGenerating: false, streamingText: "" });
  },

  clearHistory: () =>
    set({
      messages: [],
      streamingText: "",
      recentFileChanges: [],
      warningMessage: null,
    }),
}));
