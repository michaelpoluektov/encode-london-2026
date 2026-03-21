/// <reference types="vite/client" />

import type {
  BootstrapPayload,
  ChatAttachPreviewContextResult,
  FileChangeInfo,
  ProjectOpenResult,
  ProjectSaveCapturePayload,
  ProjectSaveCaptureResult,
  ProjectSavePayload,
  RecentProject,
  ShadilyManifest,
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
        openPath: (folderPath: string) => Promise<ProjectOpenResult | null>;
        save: (payload: ProjectSavePayload) => Promise<void>;
        saveCapture: (
          payload: ProjectSaveCapturePayload,
        ) => Promise<ProjectSaveCaptureResult>;
        getRecents: () => Promise<RecentProject[]>;
        readShaders: (
          folderPath: string,
          manifest: ShadilyManifest,
        ) => Promise<{ fragment: string; vertex: string }>;
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
