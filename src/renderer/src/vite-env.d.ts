/// <reference types="vite/client" />

import type { ShadilyApi } from "../../shared/shadily-api";
import type { ShadilyBrowserDebugApi } from "./api/shadily-api";

declare global {
  interface MonacoWorkerEnvironment {
    getWorker: (workerId: string, label: string) => Worker;
  }

  interface Window {
    shadily?: ShadilyApi;
    __SHADILY_BROWSER__?: ShadilyBrowserDebugApi;
  }

  var MonacoEnvironment: MonacoWorkerEnvironment | undefined;
}
