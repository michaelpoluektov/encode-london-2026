/// <reference types="vite/client" />

import type { BootstrapPayload } from "../../shared/contracts";

declare global {
  interface Window {
    shadily: {
      getBootstrapPayload: () => Promise<BootstrapPayload>;
    };
  }
}
