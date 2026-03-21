import { contextBridge, ipcRenderer } from "electron";
import type {
  ChatProjectRequest,
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
} from "../shared/contracts";
import {
  type BootstrapPayload,
  bootstrapPayloadSchema,
  chatProjectRequestSchema,
  chatSendPayloadSchema,
  chatThreadDetailSchema,
  chatThreadListSchema,
  chatThreadRequestSchema,
  historyListRequestSchema,
  historyRevertRequestSchema,
  pickFolderResultSchema,
  projectCheckpointSchema,
  projectCreatePayloadSchema,
  projectEntryResultSchema,
  projectFolderPathSchema,
  projectLayoutRequestSchema,
  projectLayoutStateSchema,
  projectOpenResultSchema,
  projectSaveCaptureResultSchema,
} from "../shared/contracts";

const shadilyDesktopApi = {
  getBootstrapPayload: async (): Promise<BootstrapPayload> =>
    bootstrapPayloadSchema.parse(
      await ipcRenderer.invoke("app:get-bootstrap-payload"),
    ),
  project: {
    pickFolder: async (): Promise<string | null> =>
      pickFolderResultSchema.parse(
        await ipcRenderer.invoke("project:pickFolder"),
      ),
    create: async (
      dir: string,
      name: string,
    ): Promise<ProjectOpenResult | null> => {
      const result = await ipcRenderer.invoke(
        "project:create",
        projectCreatePayloadSchema.parse({ parentDir: dir, name }),
      );
      return result === null ? null : projectOpenResultSchema.parse(result);
    },
    open: async (): Promise<ProjectOpenResult | null> => {
      const result = await ipcRenderer.invoke("project:open");
      return result === null ? null : projectOpenResultSchema.parse(result);
    },
    reload: async (folderPath: string): Promise<ProjectOpenResult> =>
      projectOpenResultSchema.parse(
        await ipcRenderer.invoke(
          "project:reload",
          projectFolderPathSchema.parse(folderPath),
        ),
      ),
    save: async (payload: ProjectSavePayload): Promise<ProjectOpenResult> =>
      projectOpenResultSchema.parse(
        await ipcRenderer.invoke("project:save", payload),
      ),
    saveCapture: async (
      payload: ProjectSaveCapturePayload,
    ): Promise<ProjectSaveCaptureResult> =>
      projectSaveCaptureResultSchema.parse(
        await ipcRenderer.invoke("project:saveCapture", payload),
      ),
    readEntry: async (
      payload: ProjectEntryRequest,
    ): Promise<ProjectEntryResult> =>
      projectEntryResultSchema.parse(
        await ipcRenderer.invoke("project:readEntry", payload),
      ),
    getLayout: async (
      projectId: string,
    ): Promise<ProjectLayoutState | null> => {
      const result = await ipcRenderer.invoke(
        "project:getLayout",
        projectLayoutRequestSchema.parse({ projectId }),
      );
      return result === null ? null : projectLayoutStateSchema.parse(result);
    },
    saveLayout: async (payload: ProjectLayoutSavePayload): Promise<void> => {
      await ipcRenderer.invoke("project:saveLayout", payload);
    },
  },
  chat: {
    listThreads: async (
      projectId: string,
    ): Promise<readonly ChatThreadSummary[]> =>
      chatThreadListSchema.parse(
        await ipcRenderer.invoke(
          "chat:listThreads",
          chatProjectRequestSchema.parse({ projectId }),
        ),
      ),
    getActiveThread: async (projectId: string): Promise<ChatThreadDetail> =>
      chatThreadDetailSchema.parse(
        await ipcRenderer.invoke(
          "chat:getActiveThread",
          chatProjectRequestSchema.parse({
            projectId,
          } satisfies ChatProjectRequest),
        ),
      ),
    createThread: async (projectId: string): Promise<ChatThreadDetail> =>
      chatThreadDetailSchema.parse(
        await ipcRenderer.invoke(
          "chat:createThread",
          chatProjectRequestSchema.parse({
            projectId,
          } satisfies ChatProjectRequest),
        ),
      ),
    switchThread: async (
      payload: ChatThreadRequest,
    ): Promise<ChatThreadDetail> =>
      chatThreadDetailSchema.parse(
        await ipcRenderer.invoke(
          "chat:switchThread",
          chatThreadRequestSchema.parse(payload),
        ),
      ),
    deleteThread: async (
      payload: ChatThreadRequest,
    ): Promise<ChatThreadDetail> =>
      chatThreadDetailSchema.parse(
        await ipcRenderer.invoke(
          "chat:deleteThread",
          chatThreadRequestSchema.parse(payload),
        ),
      ),
    send: async (payload: ChatSendPayload): Promise<ChatThreadDetail> =>
      chatThreadDetailSchema.parse(
        await ipcRenderer.invoke(
          "chat:send",
          chatSendPayloadSchema.parse(payload),
        ),
      ),
    stop: (): Promise<void> => ipcRenderer.invoke("chat:stop"),
    onChunk: (cb: (text: string) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, text: string) => cb(text);
      ipcRenderer.on("chat:chunk", handler);
      return () => ipcRenderer.removeListener("chat:chunk", handler);
    },
    onFileChange: (cb: (changes: FileChangeInfo[]) => void): (() => void) => {
      const handler = (
        _e: Electron.IpcRendererEvent,
        changes: FileChangeInfo[],
      ) => cb(changes);
      ipcRenderer.on("chat:file-change", handler);
      return () => ipcRenderer.removeListener("chat:file-change", handler);
    },
  },
  preview: {
    onCompileCheck: (
      cb: (requestId: string) => void,
    ): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, requestId: string) =>
        cb(requestId);
      ipcRenderer.on("preview:compile-check", handler);
      return () =>
        ipcRenderer.removeListener("preview:compile-check", handler);
    },
    respondCompile: (
      requestId: string,
      result: { success: boolean; error?: string },
    ): Promise<void> =>
      ipcRenderer.invoke("preview:compile-check-result", { requestId, result }),
    onCaptureAt: (
      cb: (requestId: string, uTime: number | null) => void,
    ): (() => void) => {
      const handler = (
        _e: Electron.IpcRendererEvent,
        requestId: string,
        uTime: number | null,
      ) => cb(requestId, uTime);
      ipcRenderer.on("preview:capture-at", handler);
      return () => ipcRenderer.removeListener("preview:capture-at", handler);
    },
    respondCapture: (
      requestId: string,
      dataUrl: string | null,
      error?: string,
    ): Promise<void> =>
      ipcRenderer.invoke("preview:capture-at-result", {
        requestId,
        dataUrl,
        error,
      }),
  },
  history: {
    listCheckpoints: async (
      payload: HistoryListRequest,
    ): Promise<ProjectCheckpoint[]> => {
      const result = await ipcRenderer.invoke(
        "history:listCheckpoints",
        historyListRequestSchema.parse(payload),
      );
      return projectCheckpointSchema.array().parse(result);
    },
    revert: async (payload: HistoryRevertRequest): Promise<ChatThreadDetail> =>
      chatThreadDetailSchema.parse(
        await ipcRenderer.invoke(
          "history:revert",
          historyRevertRequestSchema.parse(payload),
        ),
      ),
  },
};

contextBridge.exposeInMainWorld("shadily", shadilyDesktopApi);
