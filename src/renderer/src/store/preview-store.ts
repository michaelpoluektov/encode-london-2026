import { create } from "zustand";

export type PreviewDiagnostic = {
  readonly message: string;
  readonly revision: string;
  readonly timestamp: string;
};

type PreviewState = {
  readonly activeRevision: string | null;
  readonly lastSuccessfulRevision: string | null;
  readonly diagnostic: PreviewDiagnostic | null;
  readonly isStale: boolean;
  readonly markAttempted: (revision: string) => void;
  readonly markReady: (revision: string) => void;
  readonly markStale: (revision: string, message: string) => void;
};

export const createPreviewRevision = (
  fragmentShader: string,
  vertexShader: string,
): string => {
  let hash = 2166136261;
  const source = `${fragmentShader}\u0000${vertexShader}`;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const usePreviewStore = create<PreviewState>((set) => ({
  activeRevision: null,
  lastSuccessfulRevision: null,
  diagnostic: null,
  isStale: false,
  markAttempted: (revision) =>
    set((state) => ({
      activeRevision: revision,
      isStale:
        state.lastSuccessfulRevision !== null &&
        state.lastSuccessfulRevision !== revision,
    })),
  markReady: (revision) =>
    set({
      activeRevision: revision,
      lastSuccessfulRevision: revision,
      diagnostic: null,
      isStale: false,
    }),
  markStale: (revision, message) =>
    set((state) => ({
      activeRevision: revision,
      diagnostic: {
        message,
        revision,
        timestamp: new Date().toISOString(),
      },
      isStale:
        state.lastSuccessfulRevision === null ||
        state.lastSuccessfulRevision !== revision,
    })),
}));
