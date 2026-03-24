import { create } from "zustand";
import { shadilyApi } from "../api/shadily-api";
import {
  type ChatStoreState,
  createChatThread,
  createInitialChatStoreState,
  deleteChatThread,
  hydrateChatProject,
  revertChatToCheckpoint,
  sendChatMessage,
  switchChatThread,
} from "./chat-store-controller";

type ChatStore = ChatStoreState & {
  readonly hydrateProject: (projectId: string | null) => Promise<void>;
  readonly createThread: (projectId: string) => Promise<void>;
  readonly switchThread: (projectId: string, threadId: string) => Promise<void>;
  readonly deleteThread: (projectId: string, threadId: string) => Promise<void>;
  readonly sendMessage: (prompt: string) => Promise<void>;
  readonly cancelGeneration: () => void;
  readonly revertToCheckpoint: (checkpointId: string) => Promise<void>;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  ...createInitialChatStoreState(),

  hydrateProject: async (projectId) => hydrateChatProject(set, get, projectId),

  createThread: async (projectId) => createChatThread(set, get, projectId),

  switchThread: async (projectId, threadId) =>
    switchChatThread(set, get, projectId, threadId),

  deleteThread: async (projectId, threadId) =>
    deleteChatThread(set, get, projectId, threadId),

  sendMessage: async (prompt) => sendChatMessage(set, get, prompt),

  cancelGeneration: () => {
    void shadilyApi.chat.stop();
  },

  revertToCheckpoint: async (checkpointId) =>
    revertChatToCheckpoint(set, get, checkpointId),
}));
