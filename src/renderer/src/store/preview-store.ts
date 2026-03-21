import { create } from "zustand";

export type PreviewDiagnosticStage = "compile" | "render" | "capture";

export type PreviewDiagnostic = {
  readonly stage: PreviewDiagnosticStage;
  readonly message: string;
  readonly revision: string | null;
  readonly timestamp: string;
};

type PreviewFailure = {
  readonly stage: PreviewDiagnosticStage;
  readonly message: string;
  readonly revision?: string | null;
};

type PreviewState = {
  readonly activeRevision: string | null;
  readonly lastSuccessfulRevision: string | null;
  readonly diagnostics: Record<
    PreviewDiagnosticStage,
    PreviewDiagnostic | null
  >;
  readonly isStale: boolean;
  readonly markAttempted: (revision: string) => void;
  readonly markReady: (revision: string) => void;
  readonly markFailure: (failure: PreviewFailure) => void;
  readonly clearFailureStage: (stage: PreviewDiagnosticStage) => void;
};

const createEmptyDiagnostics = (): Record<
  PreviewDiagnosticStage,
  PreviewDiagnostic | null
> => ({
  capture: null,
  compile: null,
  render: null,
});

const derivePreviewStale = (
  state: Pick<PreviewState, "activeRevision" | "lastSuccessfulRevision">,
  diagnostics: Record<PreviewDiagnosticStage, PreviewDiagnostic | null>,
): boolean =>
  diagnostics.render !== null ||
  diagnostics.compile !== null ||
  (state.lastSuccessfulRevision !== null &&
    state.activeRevision !== null &&
    state.lastSuccessfulRevision !== state.activeRevision);

export const getPreviewDiagnostic = (
  state: Pick<PreviewState, "diagnostics">,
): PreviewDiagnostic | null =>
  state.diagnostics.render ??
  state.diagnostics.compile ??
  state.diagnostics.capture;

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
  diagnostics: createEmptyDiagnostics(),
  isStale: false,
  markAttempted: (revision) =>
    set((state) => {
      const nextState = {
        activeRevision: revision,
        lastSuccessfulRevision: state.lastSuccessfulRevision,
      };

      return {
        activeRevision: revision,
        isStale: derivePreviewStale(nextState, state.diagnostics),
      };
    }),
  markReady: (revision) =>
    set({
      activeRevision: revision,
      lastSuccessfulRevision: revision,
      diagnostics: createEmptyDiagnostics(),
      isStale: false,
    }),
  markFailure: ({ stage, message, revision }) =>
    set((state) => {
      const failureRevision = revision ?? state.activeRevision;
      const nextDiagnostic: PreviewDiagnostic = {
        stage,
        message,
        revision: failureRevision,
        timestamp: new Date().toISOString(),
      };
      const previousDiagnostic = state.diagnostics[stage];
      const nextDiagnostics = {
        ...state.diagnostics,
        [stage]: nextDiagnostic,
      };
      const nextState = {
        activeRevision: failureRevision,
        lastSuccessfulRevision: state.lastSuccessfulRevision,
      };
      const nextIsStale = derivePreviewStale(nextState, nextDiagnostics);

      if (
        state.activeRevision === failureRevision &&
        state.isStale === nextIsStale &&
        previousDiagnostic?.message === nextDiagnostic.message &&
        previousDiagnostic?.revision === nextDiagnostic.revision
      ) {
        return state;
      }

      return {
        activeRevision: failureRevision,
        diagnostics: nextDiagnostics,
        isStale: nextIsStale,
      };
    }),
  clearFailureStage: (stage) =>
    set((state) => {
      if (state.diagnostics[stage] === null) {
        return state;
      }

      const nextDiagnostics = {
        ...state.diagnostics,
        [stage]: null,
      };

      return {
        diagnostics: nextDiagnostics,
        isStale: derivePreviewStale(state, nextDiagnostics),
      };
    }),
}));
