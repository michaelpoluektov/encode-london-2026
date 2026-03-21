/// <reference types="vite/client" />

import type {
  BootstrapPayload,
  ChatAttachPreviewContextResult,
  FileChangeInfo,
  ProjectEntryRequest,
  ProjectEntryResult,
  ProjectOpenResult,
  ProjectSaveCapturePayload,
  ProjectSaveCaptureResult,
  ProjectSavePayload,
} from "../../shared/contracts";

declare global {
  interface MonacoWorkerEnvironment {
    getWorker: (workerId: string, label: string) => Worker;
  }

  interface Window {
    shadily: {
      getBootstrapPayload: () => Promise<BootstrapPayload>;
      project: {
        pickFolder: () => Promise<string | null>;
        create: (
          dir: string,
          name: string,
        ) => Promise<ProjectOpenResult | null>;
        open: () => Promise<ProjectOpenResult | null>;
        reload: (folderPath: string) => Promise<ProjectOpenResult>;
        save: (payload: ProjectSavePayload) => Promise<void>;
        saveCapture: (
          payload: ProjectSaveCapturePayload,
        ) => Promise<ProjectSaveCaptureResult>;
        readEntry: (
          payload: ProjectEntryRequest,
        ) => Promise<ProjectEntryResult>;
      };
      chat: {
        send: (prompt: string) => Promise<void>;
        attachPreviewContext: (
          imagePath: string,
        ) => Promise<ChatAttachPreviewContextResult>;
        stop: () => Promise<void>;
        onChunk: (cb: (text: string) => void) => () => void;
        onFileChange: (cb: (changes: FileChangeInfo[]) => void) => () => void;
      };
    };
  }

  var MonacoEnvironment: MonacoWorkerEnvironment | undefined;
}
