import type {
  ChatMessage,
  ChatThreadDetail,
  ChatThreadSummary,
  ProjectCheckpoint,
  ProjectLayoutState,
} from "../../../shared/contracts";
import {
  DEFAULT_PROJECT_FILE_PATHS,
  DEFAULT_VERTEX_SHADER,
} from "../../../shared/default-project";
import { normalizeProjectPath } from "../../../shared/path-utils";
import type {
  PreviewCompileResult,
  ShadilyApi,
} from "../../../shared/shadily-api";
import {
  type BrowserFixtureKey,
  type BrowserProjectFile,
  type BrowserProjectRecord,
  cloneProjectRecord,
  createBrowserProject,
  createFixtureProject,
  normalizeFixturePath,
  resolveBrowserFixture,
  toProjectEntryResult,
  toProjectOpenResult,
} from "./browser-fixtures";

type PreviewCaptureResult =
  | { readonly dataUrl: string }
  | { readonly error: string };
type SubgraphRenderResult =
  | { readonly dataUrl: string }
  | { readonly error: string };

type BrowserChatProjectState = {
  readonly activeThreadId: string;
  readonly threads: readonly ChatThreadSummary[];
  readonly messagesByThreadId: ReadonlyMap<string, readonly ChatMessage[]>;
};

type PendingResolver<Result> = {
  readonly resolve: (result: Result) => void;
  readonly timeoutId: ReturnType<typeof setTimeout>;
};

type PreviewRequestBridge = {
  readonly requestCompileCheck: () => Promise<PreviewCompileResult>;
  readonly requestCaptureAt: (
    uTime: number | null,
  ) => Promise<PreviewCaptureResult>;
  readonly requestSubgraphRender: (
    nodeInstanceName: string,
  ) => Promise<SubgraphRenderResult>;
};

export type ShadilyBrowserDebugApi = {
  readonly mode: "browser-mock";
  readonly fixture: BrowserFixtureKey;
  readonly capturePreview: () => Promise<PreviewCaptureResult>;
  readonly checkPreviewCompilation: () => Promise<PreviewCompileResult>;
  readonly renderSubgraph: (
    nodeInstanceName: string,
  ) => Promise<SubgraphRenderResult>;
  readonly getActiveProject: () => {
    readonly folderPath: string;
    readonly name: string;
    readonly projectId: string;
    readonly files: readonly string[];
  };
};

const REQUEST_TIMEOUT_MS = 15_000;

const now = (): string => new Date().toISOString();

const normalizeBrowserPath = (path: string): string =>
  normalizeFixturePath(normalizeProjectPath(path));

const createUserMessage = (threadId: string, text: string): ChatMessage => {
  const timestamp = now();

  return {
    id: crypto.randomUUID(),
    threadId,
    role: "user",
    runId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: null,
    parts: [
      {
        id: crypto.randomUUID(),
        type: "text",
        text,
        parentPartId: null,
      },
    ],
  };
};

const createAssistantMessage = (
  threadId: string,
  text: string,
): ChatMessage => {
  const timestamp = now();

  return {
    id: crypto.randomUUID(),
    threadId,
    role: "assistant",
    runId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: {
      type: "complete",
      reason: null,
      errorJson: null,
    },
    parts: [
      {
        id: crypto.randomUUID(),
        type: "text",
        text,
        parentPartId: null,
      },
    ],
  };
};

const createThreadSummary = (
  projectId: string,
  title: string | null,
): ChatThreadSummary => {
  const timestamp = now();

  return {
    id: crypto.randomUUID(),
    projectId,
    codexThreadId: null,
    title,
    status: "regular",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastUsedAt: timestamp,
    lastMessageAt: null,
  };
};

const createInitialChatState = (projectId: string): BrowserChatProjectState => {
  const thread = createThreadSummary(projectId, "Browser Mock");

  return {
    activeThreadId: thread.id,
    threads: [thread],
    messagesByThreadId: new Map([[thread.id, []]]),
  };
};

const getThreadDetail = (
  state: BrowserChatProjectState,
  threadId = state.activeThreadId,
): ChatThreadDetail => {
  const thread = state.threads.find((candidate) => candidate.id === threadId);

  if (thread === undefined) {
    throw new Error(`Browser mock thread [${threadId}] was not found.`);
  }

  return {
    thread,
    messages: [...(state.messagesByThreadId.get(threadId) ?? [])],
  };
};

const updateThreadUsage = (thread: ChatThreadSummary): ChatThreadSummary => {
  const timestamp = now();

  return {
    ...thread,
    updatedAt: timestamp,
    lastUsedAt: timestamp,
    lastMessageAt: timestamp,
  };
};

const createPreviewBridge = (): {
  readonly api: ShadilyApi["preview"];
  readonly bridge: PreviewRequestBridge;
} => {
  const compileListeners = new Set<(requestId: string) => void>();
  const captureListeners = new Set<
    (requestId: string, uTime: number | null) => void
  >();
  const subgraphListeners = new Set<
    (requestId: string, nodeInstanceName: string) => void
  >();
  const pendingCompileRequests = new Map<
    string,
    PendingResolver<PreviewCompileResult>
  >();
  const pendingCaptureRequests = new Map<
    string,
    PendingResolver<PreviewCaptureResult>
  >();
  const pendingSubgraphRequests = new Map<
    string,
    PendingResolver<SubgraphRenderResult>
  >();

  const resolvePendingRequest = <Result>(
    pendingRequests: Map<string, PendingResolver<Result>>,
    requestId: string,
    result: Result,
  ): void => {
    const pendingRequest = pendingRequests.get(requestId);

    if (pendingRequest === undefined) {
      return;
    }

    clearTimeout(pendingRequest.timeoutId);
    pendingRequests.delete(requestId);
    pendingRequest.resolve(result);
  };

  const createRequest = <Result, Args extends readonly unknown[]>(
    listeners: ReadonlySet<(requestId: string, ...args: Args) => void>,
    pendingRequests: Map<string, PendingResolver<Result>>,
    timeoutResult: Result,
    ...args: Args
  ): Promise<Result> => {
    if (listeners.size === 0) {
      return Promise.resolve(timeoutResult);
    }

    return new Promise<Result>((resolve) => {
      const requestId = crypto.randomUUID();
      const timeoutId = setTimeout(() => {
        pendingRequests.delete(requestId);
        resolve(timeoutResult);
      }, REQUEST_TIMEOUT_MS);

      pendingRequests.set(requestId, { resolve, timeoutId });

      for (const listener of listeners) {
        listener(requestId, ...args);
      }
    });
  };

  return {
    api: {
      onCompileCheck: (cb) => {
        compileListeners.add(cb);
        return () => {
          compileListeners.delete(cb);
        };
      },
      respondCompile: async (requestId, result) => {
        resolvePendingRequest(pendingCompileRequests, requestId, result);
      },
      onCaptureAt: (cb) => {
        captureListeners.add(cb);
        return () => {
          captureListeners.delete(cb);
        };
      },
      respondCapture: async (requestId, dataUrl, error) => {
        resolvePendingRequest(
          pendingCaptureRequests,
          requestId,
          dataUrl === null
            ? { error: error ?? "Capture failed." }
            : { dataUrl },
        );
      },
      onRenderSubgraph: (cb) => {
        subgraphListeners.add(cb);
        return () => {
          subgraphListeners.delete(cb);
        };
      },
      respondRenderSubgraph: async (requestId, dataUrl, error) => {
        resolvePendingRequest(
          pendingSubgraphRequests,
          requestId,
          dataUrl === null
            ? { error: error ?? "Subgraph render failed." }
            : { dataUrl },
        );
      },
    },
    bridge: {
      requestCompileCheck: () =>
        createRequest(compileListeners, pendingCompileRequests, {
          success: false,
          error: "Preview compile check listener unavailable.",
        }),
      requestCaptureAt: (uTime) =>
        createRequest(
          captureListeners,
          pendingCaptureRequests,
          { error: "Preview capture listener unavailable." },
          uTime,
        ),
      requestSubgraphRender: (nodeInstanceName) =>
        createRequest(
          subgraphListeners,
          pendingSubgraphRequests,
          { error: "Subgraph render listener unavailable." },
          nodeInstanceName,
        ),
    },
  };
};

export const createBrowserShadilyApi = (
  search = window.location.search,
): {
  readonly api: ShadilyApi;
  readonly debug: ShadilyBrowserDebugApi;
} => {
  const fixture = resolveBrowserFixture(search);
  const preview = createPreviewBridge();
  const initialProject = cloneProjectRecord(createFixtureProject(fixture));
  const projects = new Map<string, BrowserProjectRecord>([
    [initialProject.folderPath, initialProject],
  ]);
  const layouts = new Map<string, ProjectLayoutState>();
  const chatStates = new Map<string, BrowserChatProjectState>();
  let activeFolderPath = initialProject.folderPath;

  const getActiveProject = (): BrowserProjectRecord => {
    const activeProject = projects.get(activeFolderPath);

    if (activeProject === undefined) {
      throw new Error("Browser mock active project is unavailable.");
    }

    return activeProject;
  };

  const requireProject = (folderPath: string): BrowserProjectRecord => {
    const normalizedFolderPath = normalizeProjectPath(folderPath);
    const project =
      [...projects.values()].find(
        (candidate) =>
          normalizeProjectPath(candidate.folderPath) === normalizedFolderPath,
      ) ?? null;

    if (project === null) {
      throw new Error(`Browser mock project [${folderPath}] was not found.`);
    }

    return project;
  };

  const saveProject = (project: BrowserProjectRecord): void => {
    projects.set(project.folderPath, project);
    activeFolderPath = project.folderPath;
  };

  const ensureChatState = (projectId: string): BrowserChatProjectState => {
    const existingState = chatStates.get(projectId);

    if (existingState !== undefined) {
      return existingState;
    }

    const nextState = createInitialChatState(projectId);
    chatStates.set(projectId, nextState);
    return nextState;
  };

  const updateChatState = (
    projectId: string,
    updater: (state: BrowserChatProjectState) => BrowserChatProjectState,
  ): BrowserChatProjectState => {
    const nextState = updater(ensureChatState(projectId));
    chatStates.set(projectId, nextState);
    return nextState;
  };

  const setTextFile = (
    files: Readonly<Record<string, BrowserProjectFile>>,
    rawPath: string,
    content: string,
    language: string,
  ): Record<string, BrowserProjectFile> => ({
    ...files,
    [normalizeBrowserPath(rawPath)]: {
      kind: "text",
      content,
      isEditable: true,
      language,
    },
  });

  const api: ShadilyApi = {
    getBootstrapPayload: async () => ({
      appName: "Shadily",
      platform: "browser",
      codex: {
        available: false,
        mode: "placeholder",
      },
      initialProject: toProjectOpenResult(initialProject),
    }),
    project: {
      pickFolder: async () => "/browser/projects",
      create: async (dir, name) => {
        const project = createBrowserProject(name, dir);
        saveProject(project);
        return toProjectOpenResult(project);
      },
      open: async () => toProjectOpenResult(getActiveProject()),
      reload: async (folderPath) =>
        toProjectOpenResult(requireProject(folderPath)),
      save: async (payload) => {
        const currentProject = requireProject(payload.folderPath);
        const manifest = {
          ...payload.manifest,
          modified: now(),
        };
        let files: Record<string, BrowserProjectFile> = {
          ...currentProject.files,
        };

        for (const [rawPath, content] of Object.entries(payload.textEntries)) {
          const normalizedPath = normalizeBrowserPath(rawPath);
          const language =
            normalizedPath === DEFAULT_PROJECT_FILE_PATHS.vertex
              ? "glsl"
              : normalizedPath.endsWith(".json")
                ? "json"
                : normalizedPath.endsWith(".md")
                  ? "markdown"
                  : normalizedPath.endsWith(".glsl")
                    ? "glsl"
                    : "plaintext";
          files = setTextFile(files, normalizedPath, content, language);
        }

        files = setTextFile(
          files,
          DEFAULT_PROJECT_FILE_PATHS.manifest,
          JSON.stringify(manifest, null, 2),
          "json",
        );

        if (files[DEFAULT_PROJECT_FILE_PATHS.vertex] === undefined) {
          files = setTextFile(
            files,
            DEFAULT_PROJECT_FILE_PATHS.vertex,
            DEFAULT_VERTEX_SHADER,
            "glsl",
          );
        }

        const nextProject: BrowserProjectRecord = {
          ...currentProject,
          files,
          manifest,
        };
        saveProject(nextProject);
        return toProjectOpenResult(nextProject);
      },
      saveCapture: async (payload) => {
        const currentProject = requireProject(payload.folderPath);
        const filename = `capture-${now().replaceAll(":", "-")}-${crypto.randomUUID().slice(0, 6)}.png`;
        const relativePath = `${DEFAULT_PROJECT_FILE_PATHS.capturesDir}/${filename}`;
        const nextProject: BrowserProjectRecord = {
          ...currentProject,
          files: {
            ...currentProject.files,
            [relativePath]: {
              kind: "image",
              sourceUrl: payload.dataUrl,
            },
          },
        };
        saveProject(nextProject);

        return {
          imagePath: `${nextProject.folderPath}/${relativePath}`,
        };
      },
      readEntry: async (payload) =>
        toProjectEntryResult(requireProject(payload.folderPath), payload.path),
      getLayout: async (projectId) => layouts.get(projectId) ?? null,
      saveLayout: async ({ projectId, layout }) => {
        layouts.set(projectId, structuredClone(layout));
      },
    },
    chat: {
      listThreads: async (projectId) => ensureChatState(projectId).threads,
      getActiveThread: async (projectId) =>
        getThreadDetail(ensureChatState(projectId)),
      createThread: async (projectId) => {
        const thread = createThreadSummary(projectId, "Browser Mock");
        const state = updateChatState(projectId, (currentState) => ({
          activeThreadId: thread.id,
          threads: [thread, ...currentState.threads],
          messagesByThreadId: new Map(currentState.messagesByThreadId).set(
            thread.id,
            [],
          ),
        }));
        return getThreadDetail(state, thread.id);
      },
      switchThread: async ({ projectId, threadId }) => {
        const currentState = ensureChatState(projectId);
        const nextState = {
          ...currentState,
          activeThreadId: threadId,
        };
        chatStates.set(projectId, nextState);
        return getThreadDetail(nextState, threadId);
      },
      deleteThread: async ({ projectId, threadId }) => {
        const currentState = ensureChatState(projectId);
        const remainingThreads = currentState.threads.filter(
          (thread) => thread.id !== threadId,
        );

        if (remainingThreads.length === 0) {
          throw new Error("Browser mock requires at least one thread.");
        }

        const nextMessages = new Map(currentState.messagesByThreadId);
        nextMessages.delete(threadId);
        const activeThreadId =
          currentState.activeThreadId === threadId
            ? (remainingThreads[0]?.id ?? currentState.activeThreadId)
            : currentState.activeThreadId;
        const nextState: BrowserChatProjectState = {
          activeThreadId,
          threads: remainingThreads,
          messagesByThreadId: nextMessages,
        };
        chatStates.set(projectId, nextState);
        return getThreadDetail(nextState);
      },
      send: async ({ projectId, threadId, prompt }) => {
        const assistantText =
          "Browser mode does not run the Codex backend. Use this build for UI inspection and Playwright-driven interaction tests.";
        const state = updateChatState(projectId, (currentState) => {
          const nextMessages = [
            ...(currentState.messagesByThreadId.get(threadId) ?? []),
            createUserMessage(threadId, prompt),
            createAssistantMessage(threadId, assistantText),
          ];
          const nextMessagesByThreadId = new Map(
            currentState.messagesByThreadId,
          );
          nextMessagesByThreadId.set(threadId, nextMessages);

          return {
            activeThreadId: threadId,
            threads: currentState.threads.map((thread) =>
              thread.id === threadId ? updateThreadUsage(thread) : thread,
            ),
            messagesByThreadId: nextMessagesByThreadId,
          };
        });
        return getThreadDetail(state, threadId);
      },
      stop: async () => {},
      onChunk: () => () => {},
      onFileChange: () => () => {},
    },
    preview: preview.api,
    history: {
      listCheckpoints: async () => [] as ProjectCheckpoint[],
      revert: async () => {
        throw new Error("Browser mode does not provide checkpoints.");
      },
    },
  };

  return {
    api,
    debug: {
      mode: "browser-mock",
      fixture,
      capturePreview: () => preview.bridge.requestCaptureAt(null),
      checkPreviewCompilation: () => preview.bridge.requestCompileCheck(),
      renderSubgraph: (nodeInstanceName) =>
        preview.bridge.requestSubgraphRender(nodeInstanceName),
      getActiveProject: () => {
        const activeProject = getActiveProject();
        return {
          folderPath: activeProject.folderPath,
          name: activeProject.manifest.name,
          projectId: activeProject.manifest.projectId,
          files: Object.keys(activeProject.files)
            .map((path) => normalizeBrowserPath(path))
            .sort((left, right) => left.localeCompare(right)),
        };
      },
    },
  };
};
