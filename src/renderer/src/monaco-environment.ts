import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

const getMonacoWorker = (_workerId: string, label: string): Worker => {
  switch (label) {
    default:
      return new editorWorker();
  }
};

export const configureMonacoEnvironment = (): void => {
  const globalScope = globalThis as typeof globalThis & {
    MonacoEnvironment?: MonacoWorkerEnvironment;
  };

  globalScope.MonacoEnvironment = {
    getWorker: getMonacoWorker,
  };
};
