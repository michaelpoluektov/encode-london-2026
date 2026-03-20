/// <reference types="vite/client" />

import type {
  BootstrapPayload,
  ProjectOpenResult,
  ProjectSavePayload,
  RecentProject,
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
      };
    };
  }

  var MonacoEnvironment: MonacoWorkerEnvironment | undefined;
}
