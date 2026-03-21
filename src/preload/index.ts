import { contextBridge, ipcRenderer } from "electron";
import type {
  ChatAttachPreviewContextResult,
  FileChangeInfo,
  ProjectOpenResult,
  ProjectSaveCapturePayload,
  ProjectSaveCaptureResult,
  ProjectSavePayload,
  RecentProject,
  ShadilyManifest,
} from "../shared/contracts";
import {
  type BootstrapPayload,
  bootstrapPayloadSchema,
  chatAttachPreviewContextResultSchema,
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
    create: (dir: string, name: string): Promise<ProjectOpenResult | null> =>
      ipcRenderer.invoke("project:create", dir, name),
    open: (): Promise<ProjectOpenResult | null> =>
      ipcRenderer.invoke("project:open"),
    openPath: (folderPath: string): Promise<ProjectOpenResult | null> =>
      ipcRenderer.invoke("project:openPath", folderPath),
    save: (payload: ProjectSavePayload): Promise<void> =>
      ipcRenderer.invoke("project:save", payload),
    saveCapture: async (
      payload: ProjectSaveCapturePayload,
    ): Promise<ProjectSaveCaptureResult> =>
      projectSaveCaptureResultSchema.parse(
        await ipcRenderer.invoke("project:saveCapture", payload),
      ),
    getRecents: (): Promise<RecentProject[]> =>
      ipcRenderer.invoke("project:getRecents"),
    readShaders: (
      folderPath: string,
      manifest: ShadilyManifest,
    ): Promise<{ fragment: string; vertex: string }> =>
      ipcRenderer.invoke("project:readShaders", folderPath, manifest),
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
