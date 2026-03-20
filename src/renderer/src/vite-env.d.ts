/// <reference types="vite/client" />

import type { BootstrapPayload } from "../../shared/contracts";

declare global {
  interface MonacoWorkerEnvironment {
    getWorker: (workerId: string, label: string) => Worker;
  }

  interface Window {
    shadily: {
      getBootstrapPayload: () => Promise<BootstrapPayload>;
    };
  }

  var MonacoEnvironment: MonacoWorkerEnvironment | undefined;
}
