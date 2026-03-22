import type {
  ChatMessage,
  ChatMessagePart,
  ChatThreadDetail,
  ChatThreadSummary,
  FileChangeInfo,
  ProjectCheckpoint,
} from "../../../shared/contracts";
import { normalizeProjectPath } from "../../../shared/path-utils";
import { captureRegisteredPreview } from "../preview-capture";
import { useGraphPreviewStore } from "./graph-preview-store";
import { useProjectStore } from "./project-store";

let chunkUnsubscribe: (() => void) | null = null;
let fileChangeUnsubscribe: (() => void) | null = null;
let pendingShaderReload: Promise<void> = Promise.resolve();
let loadRequestVersion = 0;

export type ChatStoreState = {
  readonly currentProjectId: string | null;
  readonly threads: readonly ChatThreadSummary[];
  readonly activeThread: ChatThreadSummary | null;
  readonly messages: ChatMessage[];
  readonly checkpoints: readonly ProjectCheckpoint[];
  readonly isGenerating: boolean;
  readonly streamingText: string;
  readonly recentFileChanges: FileChangeInfo[];
  readonly warningMessage: string | null;
  readonly isRetrying: boolean;
};

export type ChatStoreSetter = (
  partial:
    | Partial<ChatStoreState>
    | ((state: ChatStoreState) => Partial<ChatStoreState> | ChatStoreState),
) => void;

export type ChatStoreGetter = () => ChatStoreState;

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.message.toLowerCase().includes("abort");

const isReconnectingError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes("Reconnecting");

const resetPendingShaderReload = (): void => {
  pendingShaderReload = Promise.resolve();
};

const waitForPendingShaderReload = async (): Promise<void> => {
  await pendingShaderReload.catch(() => undefined);
};

const hasTouchedPath = (
  changes: FileChangeInfo[],
  projectFolderPath: string,
  projectPath: string,
): boolean => {
  const normalizedPath = normalizeProjectPath(projectPath);

  return changes.some(
    (change) =>
      toProjectRelativePath(projectFolderPath, change.path) === normalizedPath,
  );
};

const toProjectRelativePath = (folderPath: string, path: string): string => {
  const normalizedPath = normalizeProjectPath(path);
  const normalizedFolderPath = normalizeProjectPath(folderPath).replace(
    /\/+$/,
    "",
  );

  if (normalizedPath === normalizedFolderPath) {
    return "";
  }

  const projectPrefix = `${normalizedFolderPath}/`;

  return normalizedPath.startsWith(projectPrefix)
    ? normalizedPath.slice(projectPrefix.length)
    : normalizedPath;
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

    const touchedPaths = [
      ...new Set(
        changes
          .filter((change) => change.kind !== "delete")
          .map((change) =>
            toProjectRelativePath(project.folderPath, change.path),
          )
          .filter((path) => path.length > 0),
      ),
    ];
    const openTabPaths = new Set(
      useProjectStore.getState().project?.openTabPaths ?? [],
    );
    const pathsToRefresh = touchedPaths.filter((path) =>
      openTabPaths.has(path),
    );

    await Promise.all(
      pathsToRefresh.map(async (path) => {
        const currentProject = useProjectStore.getState().project;

        if (currentProject === null) {
          return;
        }

        const refreshedDocument = await window.shadily.project.readEntry({
          folderPath: currentProject.folderPath,
          manifest: currentProject.manifest,
          path,
        });

        useProjectStore
          .getState()
          .setExternallySavedDocument(refreshedDocument);
      }),
    );

    const selectedProject = useProjectStore.getState().project;
    const selectedPath = selectedProject?.selectedEntryPath ?? null;

    if (
      selectedProject !== null &&
      selectedPath !== null &&
      hasTouchedPath(
        changes.filter((change) => change.kind !== "delete"),
        selectedProject.folderPath,
        selectedPath,
      )
    ) {
      const refreshedDocument = await window.shadily.project.readEntry({
        folderPath: selectedProject.folderPath,
        manifest: selectedProject.manifest,
        path: selectedPath,
      });

      useProjectStore.getState().setExternallySavedDocument(refreshedDocument);
    }
  } catch {
    // non-fatal — user can manually reload
  }
};

const queueShaderReload = (changes: FileChangeInfo[]): void => {
  const project = useProjectStore.getState().project;

  if (project !== null) {
    useProjectStore
      .getState()
      .markTabsAiModified(
        changes
          .map((change) =>
            toProjectRelativePath(project.folderPath, change.path),
          )
          .filter((path) => path.length > 0),
      );
  }

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
  checkpoints: readonly ProjectCheckpoint[] | null,
): void => {
  setState((state) => ({
    activeThread: detail.thread,
    messages: detail.messages,
    threads:
      threads === null
        ? upsertThreadSummary(state.threads, detail.thread)
        : threads,
    checkpoints: checkpoints ?? state.checkpoints,
  }));
};

const loadThreadCollection = async (
  projectId: string,
): Promise<{
  detail: ChatThreadDetail;
  threads: readonly ChatThreadSummary[];
  checkpoints: readonly ProjectCheckpoint[];
}> => {
  const [detail, threads] = await Promise.all([
    window.shadily.chat.getActiveThread(projectId),
    window.shadily.chat.listThreads(projectId),
  ]);

  const checkpoints = await window.shadily.history
    .listCheckpoints({ projectId, threadId: detail.thread.id })
    .catch(() => []);

  return { detail, threads, checkpoints };
};

const loadCheckpoints = async (
  projectId: string,
  threadId: string,
): Promise<readonly ProjectCheckpoint[]> =>
  window.shadily.history
    .listCheckpoints({ projectId, threadId })
    .catch(() => []);

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

export const createInitialChatStoreState = (): ChatStoreState => ({
  currentProjectId: null,
  threads: [],
  activeThread: null,
  messages: [],
  checkpoints: [],
  isGenerating: false,
  streamingText: "",
  recentFileChanges: [],
  warningMessage: null,
  isRetrying: false,
});

export const hydrateChatProject = async (
  set: ChatStoreSetter,
  get: ChatStoreGetter,
  projectId: string | null,
): Promise<void> => {
  loadRequestVersion += 1;
  const requestVersion = loadRequestVersion;

  endChatTurn();
  set({
    ...createInitialChatStoreState(),
    currentProjectId: projectId,
  });

  if (projectId === null) {
    return;
  }

  try {
    const { detail, threads, checkpoints } =
      await loadThreadCollection(projectId);

    if (
      requestVersion !== loadRequestVersion ||
      get().currentProjectId !== projectId
    ) {
      return;
    }

    replaceThreadState(set, detail, threads, checkpoints);
  } catch (error) {
    if (
      requestVersion !== loadRequestVersion ||
      get().currentProjectId !== projectId
    ) {
      return;
    }

    set({
      warningMessage:
        error instanceof Error ? error.message : "Failed to load chat threads.",
    });
  }
};

const resetTransientState = (set: ChatStoreSetter): void => {
  set({
    warningMessage: null,
    recentFileChanges: [],
    streamingText: "",
  });
};

export const createChatThread = async (
  set: ChatStoreSetter,
  get: ChatStoreGetter,
  projectId: string,
): Promise<void> => {
  if (get().isGenerating || get().currentProjectId !== projectId) {
    return;
  }

  resetTransientState(set);

  try {
    const [detail, threads] = await Promise.all([
      window.shadily.chat.createThread(projectId),
      window.shadily.chat.listThreads(projectId),
    ]);

    if (get().currentProjectId !== projectId) {
      return;
    }

    const checkpoints = await loadCheckpoints(projectId, detail.thread.id);
    replaceThreadState(set, detail, threads, checkpoints);
  } catch (error) {
    if (get().currentProjectId !== projectId) {
      return;
    }

    set({
      warningMessage:
        error instanceof Error ? error.message : "Failed to create a thread.",
    });
  }
};

export const switchChatThread = async (
  set: ChatStoreSetter,
  get: ChatStoreGetter,
  projectId: string,
  threadId: string,
): Promise<void> => {
  if (get().isGenerating || get().currentProjectId !== projectId) {
    return;
  }

  resetTransientState(set);

  try {
    const [detail, threads] = await Promise.all([
      window.shadily.chat.switchThread({ projectId, threadId }),
      window.shadily.chat.listThreads(projectId),
    ]);

    if (get().currentProjectId !== projectId) {
      return;
    }

    const checkpoints = await loadCheckpoints(projectId, threadId);
    replaceThreadState(set, detail, threads, checkpoints);
  } catch (error) {
    if (get().currentProjectId !== projectId) {
      return;
    }

    set({
      warningMessage:
        error instanceof Error ? error.message : "Failed to switch threads.",
    });
  }
};

export const deleteChatThread = async (
  set: ChatStoreSetter,
  get: ChatStoreGetter,
  projectId: string,
  threadId: string,
): Promise<void> => {
  if (
    get().isGenerating ||
    get().currentProjectId !== projectId ||
    get().threads.length <= 1
  ) {
    return;
  }

  resetTransientState(set);

  try {
    const [detail, threads] = await Promise.all([
      window.shadily.chat.deleteThread({ projectId, threadId }),
      window.shadily.chat.listThreads(projectId),
    ]);

    if (get().currentProjectId !== projectId) {
      return;
    }

    const checkpoints = await loadCheckpoints(projectId, detail.thread.id);
    replaceThreadState(set, detail, threads, checkpoints);
  } catch (error) {
    if (get().currentProjectId !== projectId) {
      return;
    }

    set({
      warningMessage:
        error instanceof Error ? error.message : "Failed to delete thread.",
    });
  }
};

export const sendChatMessage = async (
  set: ChatStoreSetter,
  get: ChatStoreGetter,
  prompt: string,
): Promise<void> => {
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

  set((state) => ({
    messages: [
      ...state.messages,
      createOptimisticUserMessage(activeThread.id, trimmedPrompt),
    ],
    isGenerating: true,
    streamingText: "",
    recentFileChanges: [],
    warningMessage: null,
  }));

  let previewPath: string | null = null;
  const previewSnapshot = useGraphPreviewStore.getState().previewSnapshot;
  const project = useProjectStore.getState().project;

  if (project !== null) {
    try {
      const captureResult = await captureRegisteredPreview();
      if (captureResult.kind === "success") {
        const saved = await window.shadily.project
          .saveCapture({
            folderPath: project.folderPath,
            dataUrl: captureResult.dataUrl,
          })
          .catch(() => null);
        previewPath = saved?.imagePath ?? null;
      }
    } catch {
      // Non-fatal
    }
  }

  beginChatTurn(set);

  try {
    let detail: Awaited<ReturnType<typeof window.shadily.chat.send>> | null =
      null;

    while (detail === null) {
      try {
        detail = await window.shadily.chat.send({
          projectId: currentProjectId,
          threadId: activeThread.id,
          prompt: trimmedPrompt,
          previewPath,
          previewSnapshot,
          fragmentShaderSource: previewSnapshot?.fragmentShaderSource ?? null,
        });
        set({ isRetrying: false });
      } catch (sendError) {
        if (!isReconnectingError(sendError)) {
          set({ isRetrying: false });
          throw sendError;
        }

        set({ isRetrying: true });
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        endChatTurn();
        beginChatTurn(set);
        set({ streamingText: "" });
      }
    }

    const [threadListResult, freshCheckpoints] = await Promise.all([
      window.shadily.chat.listThreads(currentProjectId).catch(() => null),
      loadCheckpoints(currentProjectId, activeThread.id),
    ]);
    await waitForPendingShaderReload();

    if (get().currentProjectId !== currentProjectId) {
      return;
    }

    set({
      isGenerating: false,
      streamingText: "",
    });
    replaceThreadState(set, detail, threadListResult, freshCheckpoints);
  } catch (error) {
    const [detailResult, threadListResult] = await Promise.all([
      window.shadily.chat.getActiveThread(currentProjectId).catch(() => null),
      window.shadily.chat.listThreads(currentProjectId).catch(() => null),
    ]);

    if (get().currentProjectId !== currentProjectId) {
      return;
    }

    if (detailResult !== null) {
      replaceThreadState(set, detailResult, threadListResult, null);
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
    set({ isRetrying: false });
  }
};

export const revertChatToCheckpoint = async (
  set: ChatStoreSetter,
  get: ChatStoreGetter,
  checkpointId: string,
): Promise<void> => {
  const currentProjectId = get().currentProjectId;

  if (currentProjectId === null) {
    return;
  }

  const detail = await window.shadily.history.revert({ checkpointId });
  const freshCheckpoints = await loadCheckpoints(
    currentProjectId,
    detail.thread.id,
  ).catch(() => [] as readonly ProjectCheckpoint[]);

  replaceThreadState(set, detail, null, freshCheckpoints);
  useGraphPreviewStore.getState().clearCompiledGraphShader();

  const project = useProjectStore.getState().project;

  if (project !== null) {
    try {
      const freshProject = await window.shadily.project.reload(
        project.folderPath,
      );
      useProjectStore.getState().revertProject(freshProject);
    } catch {
      // non-fatal
    }
  }
};
