import { contextBridge, ipcRenderer } from "electron";
import {
  type BootstrapPayload,
  bootstrapPayloadSchema,
} from "../shared/contracts";

const shadilyDesktopApi = {
  getBootstrapPayload: async (): Promise<BootstrapPayload> =>
    bootstrapPayloadSchema.parse(
      await ipcRenderer.invoke("app:get-bootstrap-payload"),
    ),
};

contextBridge.exposeInMainWorld("shadily", shadilyDesktopApi);
