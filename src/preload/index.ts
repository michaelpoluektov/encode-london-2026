import { contextBridge, ipcRenderer } from "electron";
import type {
  ChatAttachPreviewContextResult,
  FileChangeInfo,
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
  chatAttachPreviewContextResultSchema,
  chatPromptSchema,
  pickFolderResultSchema,
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
    send: (prompt: string): Promise<void> =>
      ipcRenderer.invoke("chat:send", chatPromptSchema.parse(prompt)),
    attachPreviewContext: async (
      imagePath: string,
    ): Promise<ChatAttachPreviewContextResult> =>
      chatAttachPreviewContextResultSchema.parse(
        await ipcRenderer.invoke("chat:attachPreviewContext", { imagePath }),
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
};

contextBridge.exposeInMainWorld("shadily", shadilyDesktopApi);
