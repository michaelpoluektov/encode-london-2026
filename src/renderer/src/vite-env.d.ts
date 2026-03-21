/// <reference types="vite/client" />

import type {
  BootstrapPayload,
  ChatSendPayload,
  ChatThreadDetail,
  ChatThreadSummary,
  ChatThreadRequest,
  FileChangeInfo,
  ProjectEntryRequest,
  ProjectEntryResult,
  ProjectLayoutSavePayload,
  ProjectLayoutState,
  ProjectOpenResult,
  ProjectSaveCapturePayload,
  ProjectSaveCaptureResult,
  ProjectSavePayload,
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
        reload: (folderPath: string) => Promise<ProjectOpenResult>;
        save: (payload: ProjectSavePayload) => Promise<ProjectOpenResult>;
        saveCapture: (
          payload: ProjectSaveCapturePayload,
        ) => Promise<ProjectSaveCaptureResult>;
        readEntry: (
          payload: ProjectEntryRequest,
        ) => Promise<ProjectEntryResult>;
        getLayout: (projectId: string) => Promise<ProjectLayoutState | null>;
        saveLayout: (payload: ProjectLayoutSavePayload) => Promise<void>;
      };
      chat: {
        listThreads: (
          projectId: string,
        ) => Promise<readonly ChatThreadSummary[]>;
        getActiveThread: (projectId: string) => Promise<ChatThreadDetail>;
        createThread: (projectId: string) => Promise<ChatThreadDetail>;
        switchThread: (payload: ChatThreadRequest) => Promise<ChatThreadDetail>;
        deleteThread: (payload: ChatThreadRequest) => Promise<ChatThreadDetail>;
        send: (payload: ChatSendPayload) => Promise<ChatThreadDetail>;
        stop: () => Promise<void>;
        onChunk: (cb: (text: string) => void) => () => void;
        onFileChange: (cb: (changes: FileChangeInfo[]) => void) => () => void;
      };
    };
  }

  var MonacoEnvironment: MonacoWorkerEnvironment | undefined;
}
