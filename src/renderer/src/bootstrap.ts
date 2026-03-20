import { configureMonacoEnvironment } from "./monaco-environment";

const bootstrapRenderer = async (): Promise<void> => {
  configureMonacoEnvironment();
  await import("./renderer-app");
};

void bootstrapRenderer();
