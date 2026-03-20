import { create } from "zustand";
import type { ChatMessage, FileChangeInfo } from "../../../shared/contracts";
import { useProjectStore } from "./project-store";

let chunkUnsubscribe: (() => void) | null = null;
let fileChangeUnsubscribe: (() => void) | null = null;

const PREFLIGHT_PROMPT =
  "Read every file in this project directory and understand what is here. " +
  "Then give a concise summary: what the shaders do, what visual effect they produce, " +
  "and anything else worth knowing about this project.";

type ChatStore = {
  readonly messages: ChatMessage[];
  readonly isGenerating: boolean;
  readonly isPreflighting: boolean;
  readonly streamingText: string;
  readonly recentFileChanges: FileChangeInfo[];

  readonly sendMessage: (prompt: string) => Promise<void>;
  readonly runPreflight: () => Promise<void>;
  readonly cancelGeneration: () => void;
  readonly clearHistory: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isGenerating: false,
  isPreflighting: false,
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
    fileChangeUnsubscribe = window.shadily.chat.onFileChange(async (changes) => {
      set({ recentFileChanges: changes });
      // Live-reload shader files that Codex edited
      const project = useProjectStore.getState().project;
      if (!project) return;
      const shaderFiles = new Set([
        project.manifest.shaders.fragment,
        project.manifest.shaders.vertex,
      ]);
      const touched = changes.some((c) =>
        shaderFiles.has(c.path.split("/").pop() ?? c.path),
      );
      if (!touched) return;
      try {
        const fresh = await window.shadily.project.readShaders(
          project.folderPath,
          project.manifest,
        );
        useProjectStore.getState().updateShader("fragment", fresh.fragment);
        useProjectStore.getState().updateShader("vertex", fresh.vertex);
      } catch {
        // non-fatal — user can manually reload
      }
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

  runPreflight: async () => {
    // Clear history from any previous project and run a silent preflight turn.
    // We don't add a user bubble — this is an automatic background scan.
    set({
      messages: [],
      isGenerating: true,
      isPreflighting: true,
      streamingText: "",
      recentFileChanges: [],
    });

    chunkUnsubscribe?.();
    chunkUnsubscribe = window.shadily.chat.onChunk((text) => {
      set({ streamingText: text });
    });

    fileChangeUnsubscribe?.();
    fileChangeUnsubscribe = window.shadily.chat.onFileChange(async (changes) => {
      set({ recentFileChanges: changes });
      const project = useProjectStore.getState().project;
      if (!project) return;
      const shaderFiles = new Set([
        project.manifest.shaders.fragment,
        project.manifest.shaders.vertex,
      ]);
      const touched = changes.some((c) =>
        shaderFiles.has(c.path.split("/").pop() ?? c.path),
      );
      if (!touched) return;
      try {
        const fresh = await window.shadily.project.readShaders(
          project.folderPath,
          project.manifest,
        );
        useProjectStore.getState().updateShader("fragment", fresh.fragment);
        useProjectStore.getState().updateShader("vertex", fresh.vertex);
      } catch {
        // non-fatal
      }
    });

    try {
      await window.shadily.chat.send(PREFLIGHT_PROMPT);

      const summary = get().streamingText;
      if (summary) {
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: summary,
        };
        set((s) => ({ messages: [...s.messages, msg] }));
      }
    } catch {
      // non-fatal — user can still chat
    } finally {
      chunkUnsubscribe?.();
      chunkUnsubscribe = null;
      fileChangeUnsubscribe?.();
      fileChangeUnsubscribe = null;
      set({ isGenerating: false, isPreflighting: false, streamingText: "" });
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
