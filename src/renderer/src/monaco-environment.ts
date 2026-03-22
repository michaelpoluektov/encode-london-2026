import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";

const getMonacoWorker = (_workerId: string, label: string): Worker => {
  switch (label) {
    case "json":
      return new jsonWorker();
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
