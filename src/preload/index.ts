import { contextBridge, ipcRenderer } from "electron";
import type {
  ProjectOpenResult,
  ProjectSavePayload,
  RecentProject,
} from "../shared/contracts";
import {
  type BootstrapPayload,
  bootstrapPayloadSchema,
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
    getRecents: (): Promise<RecentProject[]> =>
      ipcRenderer.invoke("project:getRecents"),
  },
};

contextBridge.exposeInMainWorld("shadily", shadilyDesktopApi);
