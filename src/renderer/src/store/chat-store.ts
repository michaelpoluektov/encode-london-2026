import { create } from "zustand";
import type {
  ChatMessage,
  ChatMessagePart,
  ChatThreadDetail,
  ChatThreadSummary,
  FileChangeInfo,
} from "../../../shared/contracts";
import { useProjectStore } from "./project-store";

let chunkUnsubscribe: (() => void) | null = null;
let fileChangeUnsubscribe: (() => void) | null = null;
let pendingShaderReload: Promise<void> = Promise.resolve();
let loadRequestVersion = 0;

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

      useProjectStore.getState().setSavedDocument(refreshedDocument);
    }
  } catch {
    // non-fatal — user can manually reload
  }
};

const queueShaderReload = (changes: FileChangeInfo[]): void => {
  useProjectStore.getState().markTabsAiModified(changes.map((c) => c.path));
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

type ChatStoreState = {
  readonly currentProjectId: string | null;
  readonly threads: readonly ChatThreadSummary[];
  readonly activeThread: ChatThreadSummary | null;
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

const createOptimisticUserMessage = (
  threadId: string,
  prompt: string,
): ChatMessage => {
  const now = new Date().toISOString();
  const textPart: ChatMessagePart = {
    id: crypto.randomUUID(),
    type: "text",
    text: prompt,
    parentPartId: null,
  };

  return {
    id: crypto.randomUUID(),
    threadId,
    role: "user",
    runId: null,
    createdAt: now,
    updatedAt: now,
    status: null,
    parts: [textPart],
  };
};

const upsertThreadSummary = (
  threads: readonly ChatThreadSummary[],
  nextThread: ChatThreadSummary,
): readonly ChatThreadSummary[] => {
  const remainingThreads = threads.filter(
    (thread) => thread.id !== nextThread.id,
  );
  return [nextThread, ...remainingThreads].sort(
    (left, right) =>
      new Date(right.lastUsedAt).getTime() -
      new Date(left.lastUsedAt).getTime(),
  );
};

const replaceThreadState = (
  setState: ChatStoreSetter,
  detail: ChatThreadDetail,
  threads: readonly ChatThreadSummary[] | null,
): void => {
  setState((state) => ({
    activeThread: detail.thread,
    messages: detail.messages,
    threads:
      threads === null
        ? upsertThreadSummary(state.threads, detail.thread)
        : threads,
  }));
};

const loadThreadCollection = async (
  projectId: string,
): Promise<{
  detail: ChatThreadDetail;
  threads: readonly ChatThreadSummary[];
}> => {
  const [detail, threads] = await Promise.all([
    window.shadily.chat.getActiveThread(projectId),
    window.shadily.chat.listThreads(projectId),
  ]);

  return { detail, threads };
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

type ChatStore = ChatStoreState & {
  readonly hydrateProject: (projectId: string | null) => Promise<void>;
  readonly createThread: (projectId: string) => Promise<void>;
  readonly switchThread: (projectId: string, threadId: string) => Promise<void>;
  readonly deleteThread: (projectId: string, threadId: string) => Promise<void>;
  readonly sendMessage: (prompt: string) => Promise<void>;
  readonly cancelGeneration: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  currentProjectId: null,
  threads: [],
  activeThread: null,
  messages: [],
  isGenerating: false,
  streamingText: "",
  recentFileChanges: [],
  warningMessage: null,

  hydrateProject: async (projectId) => {
    loadRequestVersion += 1;
    const requestVersion = loadRequestVersion;

    endChatTurn();
    set({
      currentProjectId: projectId,
      threads: [],
      activeThread: null,
      messages: [],
      isGenerating: false,
      streamingText: "",
      recentFileChanges: [],
      warningMessage: null,
    });

    if (projectId === null) {
      return;
    }

    try {
      const { detail, threads } = await loadThreadCollection(projectId);

      if (
        requestVersion !== loadRequestVersion ||
        get().currentProjectId !== projectId
      ) {
        return;
      }

      replaceThreadState(set, detail, threads);
    } catch (error) {
      if (
        requestVersion !== loadRequestVersion ||
        get().currentProjectId !== projectId
      ) {
        return;
      }

      set({
        warningMessage:
          error instanceof Error
            ? error.message
            : "Failed to load chat threads.",
      });
    }
  },

  createThread: async (projectId) => {
    if (get().isGenerating || get().currentProjectId !== projectId) {
      return;
    }

    set({
      warningMessage: null,
      recentFileChanges: [],
      streamingText: "",
    });

    try {
      const detail = await window.shadily.chat.createThread(projectId);
      const threads = await window.shadily.chat.listThreads(projectId);

      if (get().currentProjectId !== projectId) {
        return;
      }

      replaceThreadState(set, detail, threads);
    } catch (error) {
      if (get().currentProjectId !== projectId) {
        return;
      }

      set({
        warningMessage:
          error instanceof Error ? error.message : "Failed to create a thread.",
      });
    }
  },

  switchThread: async (projectId, threadId) => {
    if (get().isGenerating || get().currentProjectId !== projectId) {
      return;
    }

    set({
      warningMessage: null,
      recentFileChanges: [],
      streamingText: "",
    });

    try {
      const detail = await window.shadily.chat.switchThread({
        projectId,
        threadId,
      });
      const threads = await window.shadily.chat.listThreads(projectId);

      if (get().currentProjectId !== projectId) {
        return;
      }

      replaceThreadState(set, detail, threads);
    } catch (error) {
      if (get().currentProjectId !== projectId) {
        return;
      }

      set({
        warningMessage:
          error instanceof Error ? error.message : "Failed to switch threads.",
      });
    }
  },

  deleteThread: async (projectId, threadId) => {
    if (
      get().isGenerating ||
      get().currentProjectId !== projectId ||
      get().threads.length <= 1
    ) {
      return;
    }

    set({
      warningMessage: null,
      recentFileChanges: [],
    });

    try {
      const detail = await window.shadily.chat.deleteThread({
        projectId,
        threadId,
      });
      const threads = await window.shadily.chat.listThreads(projectId);

      if (get().currentProjectId !== projectId) {
        return;
      }

      replaceThreadState(set, detail, threads);
    } catch (error) {
      if (get().currentProjectId !== projectId) {
        return;
      }

      set({
        warningMessage:
          error instanceof Error ? error.message : "Failed to delete thread.",
      });
    }
  },

  sendMessage: async (prompt) => {
    const currentProjectId = get().currentProjectId;
    const activeThread = get().activeThread;
    const trimmedPrompt = prompt.trim();

    if (
      get().isGenerating ||
      currentProjectId === null ||
      activeThread === null ||
      trimmedPrompt.length === 0
    ) {
      return;
    }

    set((s) => ({
      messages: [
        ...s.messages,
        createOptimisticUserMessage(activeThread.id, trimmedPrompt),
      ],
      isGenerating: true,
      streamingText: "",
      recentFileChanges: [],
      warningMessage: null,
    }));

    beginChatTurn(set);

    try {
      const detail = await window.shadily.chat.send({
        projectId: currentProjectId,
        threadId: activeThread.id,
        prompt: trimmedPrompt,
      });
      const threadListResult = await window.shadily.chat
        .listThreads(currentProjectId)
        .catch(() => null);
      await waitForPendingShaderReload();

      if (get().currentProjectId !== currentProjectId) {
        return;
      }

      set({
        isGenerating: false,
        streamingText: "",
      });
      replaceThreadState(set, detail, threadListResult);
    } catch (error) {
      const [detailResult, threadListResult] = await Promise.all([
        window.shadily.chat.getActiveThread(currentProjectId).catch(() => null),
        window.shadily.chat.listThreads(currentProjectId).catch(() => null),
      ]);

      if (get().currentProjectId !== currentProjectId) {
        return;
      }

      if (detailResult !== null) {
        replaceThreadState(set, detailResult, threadListResult);
      }

      set({
        isGenerating: false,
        streamingText: "",
        warningMessage: isAbortError(error)
          ? null
          : error instanceof Error
            ? error.message
            : "The Codex turn failed before completion.",
      });
    } finally {
      endChatTurn();
    }
  },

  cancelGeneration: () => {
    void window.shadily.chat.stop();
  },
}));
