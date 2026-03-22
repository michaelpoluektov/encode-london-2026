import { create } from "zustand";

export type SubgraphPreviewStatus =
  | "idle"
  | "queued"
  | "rendering"
  | "ready"
  | "error";

export type SubgraphPreviewEntry = {
  readonly error: string | null;
  readonly imageUrl: string | null;
  readonly requestKey: string | null;
  readonly status: SubgraphPreviewStatus;
};

type SubgraphPreviewStore = {
  readonly byNodeId: Readonly<Record<string, SubgraphPreviewEntry>>;
  readonly clear: () => void;
  readonly markError: (
    nodeId: string,
    requestKey: string,
    error: string,
  ) => void;
  readonly markQueued: (nodeId: string, requestKey: string) => void;
  readonly markReady: (
    nodeId: string,
    requestKey: string,
    imageUrl: string,
  ) => void;
  readonly markRendering: (nodeId: string, requestKey: string) => void;
  readonly syncNodes: (nodeIds: readonly string[]) => void;
};

export const EMPTY_SUBGRAPH_PREVIEW_ENTRY: SubgraphPreviewEntry = Object.freeze(
  {
    error: null,
    imageUrl: null,
    requestKey: null,
    status: "idle",
  },
);

const createQueuedEntry = (
  currentEntry: SubgraphPreviewEntry | undefined,
  requestKey: string,
): SubgraphPreviewEntry => ({
  error: null,
  imageUrl: currentEntry?.imageUrl ?? null,
  requestKey,
  status: "queued",
});

const createRenderingEntry = (
  currentEntry: SubgraphPreviewEntry | undefined,
  requestKey: string,
): SubgraphPreviewEntry => ({
  error: null,
  imageUrl: currentEntry?.imageUrl ?? null,
  requestKey,
  status: "rendering",
});

export const useSubgraphPreviewStore = create<SubgraphPreviewStore>((set) => ({
  byNodeId: {},
  clear: () => set({ byNodeId: {} }),
  syncNodes: (nodeIds) =>
    set((state) => {
      const nextNodeIds = new Set(nodeIds);
      const nextEntries = Object.fromEntries(
        nodeIds.map((nodeId) => [
          nodeId,
          state.byNodeId[nodeId] ?? EMPTY_SUBGRAPH_PREVIEW_ENTRY,
        ]),
      );
      const currentNodeIds = Object.keys(state.byNodeId);
      const nextEntryIds = Object.keys(nextEntries);

      if (
        nextEntryIds.length === currentNodeIds.length &&
        currentNodeIds.every((nodeId) => nextNodeIds.has(nodeId)) &&
        currentNodeIds.every(
          (nodeId) => state.byNodeId[nodeId] === nextEntries[nodeId],
        )
      ) {
        return state;
      }

      return {
        byNodeId: nextEntries,
      };
    }),
  markQueued: (nodeId, requestKey) =>
    set((state) => {
      const currentEntry = state.byNodeId[nodeId];
      const nextEntry = createQueuedEntry(currentEntry, requestKey);

      if (
        currentEntry?.requestKey === nextEntry.requestKey &&
        currentEntry?.status === nextEntry.status &&
        currentEntry?.imageUrl === nextEntry.imageUrl &&
        currentEntry?.error === nextEntry.error
      ) {
        return state;
      }

      return {
        byNodeId: {
          ...state.byNodeId,
          [nodeId]: nextEntry,
        },
      };
    }),
  markRendering: (nodeId, requestKey) =>
    set((state) => {
      const currentEntry = state.byNodeId[nodeId];

      if (currentEntry?.requestKey !== requestKey) {
        return state;
      }

      const nextEntry = createRenderingEntry(currentEntry, requestKey);

      if (
        currentEntry.status === nextEntry.status &&
        currentEntry.imageUrl === nextEntry.imageUrl &&
        currentEntry.error === nextEntry.error
      ) {
        return state;
      }

      return {
        byNodeId: {
          ...state.byNodeId,
          [nodeId]: nextEntry,
        },
      };
    }),
  markReady: (nodeId, requestKey, imageUrl) =>
    set((state) => {
      const currentEntry = state.byNodeId[nodeId];

      if (currentEntry?.requestKey !== requestKey) {
        return state;
      }

      if (
        currentEntry.status === "ready" &&
        currentEntry.imageUrl === imageUrl &&
        currentEntry.error === null
      ) {
        return state;
      }

      return {
        byNodeId: {
          ...state.byNodeId,
          [nodeId]: {
            error: null,
            imageUrl,
            requestKey,
            status: "ready",
          },
        },
      };
    }),
  markError: (nodeId, requestKey, error) =>
    set((state) => {
      const currentEntry = state.byNodeId[nodeId];

      if (currentEntry?.requestKey !== requestKey) {
        return state;
      }

      if (currentEntry.status === "error" && currentEntry.error === error) {
        return state;
      }

      return {
        byNodeId: {
          ...state.byNodeId,
          [nodeId]: {
            error,
            imageUrl: currentEntry.imageUrl,
            requestKey,
            status: "error",
          },
        },
      };
    }),
}));
