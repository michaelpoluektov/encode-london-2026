/// <reference types="vite/client" />

import type {
  BootstrapPayload,
  FileChangeInfo,
  ProjectOpenResult,
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
        getRecents: () => Promise<RecentProject[]>;
        readShaders: (
          folderPath: string,
          manifest: ShadilyManifest,
        ) => Promise<{ fragment: string; vertex: string }>;
      };
      chat: {
        send: (prompt: string) => Promise<void>;
        stop: () => Promise<void>;
        onChunk: (cb: (text: string) => void) => () => void;
        onFileChange: (cb: (changes: FileChangeInfo[]) => void) => () => void;
      };
    };
  }

  var MonacoEnvironment: MonacoWorkerEnvironment | undefined;
}
