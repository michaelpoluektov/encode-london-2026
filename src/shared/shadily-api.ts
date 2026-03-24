import type {
  BootstrapPayload,
  ChatSendPayload,
  ChatThreadDetail,
  ChatThreadRequest,
  ChatThreadSummary,
  FileChangeInfo,
  HistoryListRequest,
  HistoryRevertRequest,
  ProjectCheckpoint,
  ProjectEntryRequest,
  ProjectEntryResult,
  ProjectLayoutSavePayload,
  ProjectLayoutState,
  ProjectOpenResult,
  ProjectSaveCapturePayload,
  ProjectSaveCaptureResult,
  ProjectSavePayload,
} from "./contracts";

export type PreviewCompileResult = {
  readonly success: boolean;
  readonly error?: string;
};

export type ShadilyApi = {
  readonly getBootstrapPayload: () => Promise<BootstrapPayload>;
  readonly project: {
    readonly pickFolder: () => Promise<string | null>;
    readonly create: (
      dir: string,
      name: string,
    ) => Promise<ProjectOpenResult | null>;
    readonly open: () => Promise<ProjectOpenResult | null>;
    readonly reload: (folderPath: string) => Promise<ProjectOpenResult>;
    readonly save: (payload: ProjectSavePayload) => Promise<ProjectOpenResult>;
    readonly saveCapture: (
      payload: ProjectSaveCapturePayload,
    ) => Promise<ProjectSaveCaptureResult>;
    readonly readEntry: (
      payload: ProjectEntryRequest,
    ) => Promise<ProjectEntryResult>;
    readonly getLayout: (
      projectId: string,
    ) => Promise<ProjectLayoutState | null>;
    readonly saveLayout: (payload: ProjectLayoutSavePayload) => Promise<void>;
  };
  readonly chat: {
    readonly listThreads: (
      projectId: string,
    ) => Promise<readonly ChatThreadSummary[]>;
    readonly getActiveThread: (projectId: string) => Promise<ChatThreadDetail>;
    readonly createThread: (projectId: string) => Promise<ChatThreadDetail>;
    readonly switchThread: (
      payload: ChatThreadRequest,
    ) => Promise<ChatThreadDetail>;
    readonly deleteThread: (
      payload: ChatThreadRequest,
    ) => Promise<ChatThreadDetail>;
    readonly send: (payload: ChatSendPayload) => Promise<ChatThreadDetail>;
    readonly stop: () => Promise<void>;
    readonly onChunk: (cb: (text: string) => void) => () => void;
    readonly onFileChange: (
      cb: (changes: FileChangeInfo[]) => void,
    ) => () => void;
  };
  readonly preview: {
    readonly onCompileCheck: (cb: (requestId: string) => void) => () => void;
    readonly respondCompile: (
      requestId: string,
      result: PreviewCompileResult,
    ) => Promise<void>;
    readonly onCaptureAt: (
      cb: (requestId: string, uTime: number | null) => void,
    ) => () => void;
    readonly respondCapture: (
      requestId: string,
      dataUrl: string | null,
      error?: string,
    ) => Promise<void>;
    readonly onRenderSubgraph: (
      cb: (requestId: string, nodeInstanceName: string) => void,
    ) => () => void;
    readonly respondRenderSubgraph: (
      requestId: string,
      dataUrl: string | null,
      error?: string,
    ) => Promise<void>;
  };
  readonly history: {
    readonly listCheckpoints: (
      payload: HistoryListRequest,
    ) => Promise<ProjectCheckpoint[]>;
    readonly revert: (
      payload: HistoryRevertRequest,
    ) => Promise<ChatThreadDetail>;
  };
};
