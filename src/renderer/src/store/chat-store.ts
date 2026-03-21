import { create } from "zustand";
import type { ChatMessage, FileChangeInfo } from "../../../shared/contracts";
import { captureRegisteredPreview } from "../preview-capture";
import { useProjectStore } from "./project-store";

let chunkUnsubscribe: (() => void) | null = null;
let fileChangeUnsubscribe: (() => void) | null = null;
let pendingShaderReload: Promise<void> = Promise.resolve();

const MAX_PREVIEW_FOLLOW_UPS = 3;

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

const normalizeProjectPath = (path: string): string =>
  path.replaceAll("\\", "/");

const hasTouchedPath = (
  changes: FileChangeInfo[],
  projectPath: string,
): boolean => {
  const normalizedPath = normalizeProjectPath(projectPath);

  return changes.some(
    (change) => normalizeProjectPath(change.path) === normalizedPath,
  );
};

const refreshTouchedProject = async (
  changes: FileChangeInfo[],
): Promise<void> => {
  const project = useProjectStore.getState().project;

  if (project === null) {
    return;
  }

  try {
    const freshProject = await window.shadily.project.reload(
      project.folderPath,
    );
    useProjectStore.getState().refreshProject(freshProject);

    const selectedProject = useProjectStore.getState().project;
    const selectedPath = selectedProject?.selectedEntryPath ?? null;

    if (
      selectedProject !== null &&
      selectedPath !== null &&
      hasTouchedPath(changes, selectedPath)
    ) {
      const refreshedDocument = await window.shadily.project.readEntry({
        folderPath: selectedProject.folderPath,
        manifest: selectedProject.manifest,
        path: selectedPath,
      });

      useProjectStore.getState().setDocument(refreshedDocument);
    }
  } catch {
    // non-fatal — user can manually reload
  }
};

const queueShaderReload = (changes: FileChangeInfo[]): void => {
  pendingShaderReload = pendingShaderReload
    .catch(() => undefined)
    .then(async () => refreshTouchedProject(changes));
};

const clearChatSubscriptions = (): void => {
  chunkUnsubscribe?.();
  chunkUnsubscribe = null;
  fileChangeUnsubscribe?.();
  fileChangeUnsubscribe = null;
};

const getImageLabel = (imagePath: string): string =>
  imagePath.split("/").pop() ?? imagePath;

type ChatStoreState = {
  readonly messages: ChatMessage[];
  readonly isGenerating: boolean;
  readonly streamingText: string;
  readonly recentFileChanges: FileChangeInfo[];
  readonly warningMessage: string | null;
};

type ChatStoreSetter = (
  partial:
    | Partial<ChatStoreState>
    | ((state: ChatStoreState) => Partial<ChatStoreState> | ChatStoreState),
) => void;

const appendChatMessage = (
  setState: ChatStoreSetter,
  message: ChatMessage,
): void => {
  setState((state) => ({ messages: [...state.messages, message] }));
};

const updateChatMessage = (
  setState: ChatStoreSetter,
  messageId: string,
  content: string,
): void => {
  setState((state) => ({
    messages: state.messages.map((message) =>
      message.id === messageId ? { ...message, content } : message,
    ),
  }));
};

const beginChatTurn = (setState: ChatStoreSetter): void => {
  resetPendingShaderReload();
  clearChatSubscriptions();
  chunkUnsubscribe = window.shadily.chat.onChunk((text) => {
    setState({ streamingText: text });
  });

  fileChangeUnsubscribe = window.shadily.chat.onFileChange((changes) => {
    setState({ recentFileChanges: changes });
    queueShaderReload(changes);
  });
};

const endChatTurn = (): void => {
  clearChatSubscriptions();
  resetPendingShaderReload();
};

const flushStreamingMessage = (
  setState: ChatStoreSetter,
  getState: () => Pick<ChatStoreState, "streamingText">,
): void => {
  const finalText = getState().streamingText;

  if (!finalText) {
    setState({ streamingText: "" });
    return;
  }

  appendChatMessage(setState, {
    id: crypto.randomUUID(),
    role: "assistant",
    content: finalText,
  });
  setState({ streamingText: "" });
};

const runPreviewFollowUps = async (
  setState: ChatStoreSetter,
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

type ChatStore = ChatStoreState & {
  readonly sendMessage: (prompt: string) => Promise<void>;
  readonly cancelGeneration: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isGenerating: false,
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

    beginChatTurn(set);

    try {
      await window.shadily.chat.send(prompt);
      flushStreamingMessage(set, get);

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
      endChatTurn();
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
}));
