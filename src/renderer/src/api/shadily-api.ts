import type { ShadilyApi } from "../../../shared/shadily-api";
import {
  createBrowserShadilyApi,
  type ShadilyBrowserDebugApi,
} from "./browser-shadily-api";

type ShadilyApiMode = "electron" | "browser-mock";

const hasWindowShadilyApi = (value: unknown): value is ShadilyApi =>
  typeof value === "object" &&
  value !== null &&
  "getBootstrapPayload" in value &&
  typeof value.getBootstrapPayload === "function";

const resolveShadilyApi = (): {
  readonly api: ShadilyApi;
  readonly debug: ShadilyBrowserDebugApi | null;
  readonly mode: ShadilyApiMode;
} => {
  if (hasWindowShadilyApi(window.shadily)) {
    return {
      api: window.shadily,
      debug: null,
      mode: "electron",
    };
  }

  const browserApi = createBrowserShadilyApi();

  return {
    api: browserApi.api,
    debug: browserApi.debug,
    mode: "browser-mock",
  };
};

const resolvedShadilyApi = resolveShadilyApi();

export const shadilyApi = resolvedShadilyApi.api;
export const shadilyApiMode = resolvedShadilyApi.mode;
export const shadilyBrowserDebugApi = resolvedShadilyApi.debug;
export type { ShadilyBrowserDebugApi };
