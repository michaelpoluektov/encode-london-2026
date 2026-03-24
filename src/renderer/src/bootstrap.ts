import { shadilyApiMode, shadilyBrowserDebugApi } from "./api/shadily-api";
import { configureMonacoEnvironment } from "./monaco-environment";

const bootstrapRenderer = async (): Promise<void> => {
  document.documentElement.dataset.shadilyApiMode = shadilyApiMode;
  if (shadilyBrowserDebugApi !== null) {
    window.__SHADILY_BROWSER__ = shadilyBrowserDebugApi;
  }
  configureMonacoEnvironment();
  await import("./renderer-app");
};

void bootstrapRenderer();
