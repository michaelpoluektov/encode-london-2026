import { contextBridge, ipcRenderer } from "electron";
import type {
  ChatAttachPreviewContextResult,
  FileChangeInfo,
  ProjectEntryRequest,
  ProjectEntryResult,
  ProjectOpenResult,
  ProjectSaveCapturePayload,
  ProjectSaveCaptureResult,
  ProjectSavePayload,
} from "../shared/contracts";
import {
  type BootstrapPayload,
  bootstrapPayloadSchema,
  chatAttachPreviewContextResultSchema,
  projectEntryResultSchema,
  projectOpenResultSchema,
  projectSaveCaptureResultSchema,
} from "../shared/contracts";

const shadilyDesktopApi = {
  getBootstrapPayload: async (): Promise<BootstrapPayload> =>
    bootstrapPayloadSchema.parse(
      await ipcRenderer.invoke("app:get-bootstrap-payload"),
    ),
  project: {
    pickFolder: (): Promise<string | null> =>
      ipcRenderer.invoke("project:pickFolder"),
    create: async (
      dir: string,
      name: string,
    ): Promise<ProjectOpenResult | null> => {
      const result = await ipcRenderer.invoke("project:create", dir, name);
      return result === null ? null : projectOpenResultSchema.parse(result);
    },
    open: async (): Promise<ProjectOpenResult | null> => {
      const result = await ipcRenderer.invoke("project:open");
      return result === null ? null : projectOpenResultSchema.parse(result);
    },
    reload: async (folderPath: string): Promise<ProjectOpenResult> =>
      projectOpenResultSchema.parse(
        await ipcRenderer.invoke("project:reload", folderPath),
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
  },
  chat: {
    send: (prompt: string): Promise<void> =>
      ipcRenderer.invoke("chat:send", prompt),
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
