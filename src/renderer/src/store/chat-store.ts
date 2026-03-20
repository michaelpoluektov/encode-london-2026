import { create } from "zustand";
import type { ChatMessage, FileChangeInfo } from "../../../shared/contracts";

let chunkUnsubscribe: (() => void) | null = null;
let fileChangeUnsubscribe: (() => void) | null = null;

type ChatStore = {
  readonly messages: ChatMessage[];
  readonly isGenerating: boolean;
  readonly streamingText: string;
  readonly recentFileChanges: FileChangeInfo[];

  readonly sendMessage: (prompt: string) => Promise<void>;
  readonly cancelGeneration: () => void;
  readonly clearHistory: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isGenerating: false,
  streamingText: "",
  recentFileChanges: [],

  sendMessage: async (prompt) => {
    if (get().isGenerating) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };

    set((s) => ({
      messages: [...s.messages, userMessage],
      isGenerating: true,
      streamingText: "",
      recentFileChanges: [],
    }));

    // Subscribe to streaming chunks
    chunkUnsubscribe?.();
    chunkUnsubscribe = window.shadily.chat.onChunk((text) => {
      set({ streamingText: text });
    });

    fileChangeUnsubscribe?.();
    fileChangeUnsubscribe = window.shadily.chat.onFileChange((changes) => {
      set({ recentFileChanges: changes });
    });

    try {
      await window.shadily.chat.send(prompt);

      const finalText = get().streamingText;
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: finalText,
      };

      set((s) => ({
        messages: [...s.messages, assistantMessage],
        isGenerating: false,
        streamingText: "",
      }));
    } catch {
      set({ isGenerating: false, streamingText: "" });
    } finally {
      chunkUnsubscribe?.();
      chunkUnsubscribe = null;
      fileChangeUnsubscribe?.();
      fileChangeUnsubscribe = null;
    }
  },

  cancelGeneration: () => {
    window.shadily.chat.stop();
    const partial = useChatStore.getState().streamingText;
    if (partial) {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: partial,
      };
      set((s) => ({ messages: [...s.messages, msg] }));
    }
    set({ isGenerating: false, streamingText: "" });
  },

  clearHistory: () => set({ messages: [], streamingText: "", recentFileChanges: [] }),
}));
