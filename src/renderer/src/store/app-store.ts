import { create } from "zustand";

export type CollapsiblePaneId =
  | "project"
  | "source"
  | "graph"
  | "chat"
  | "render";

type PaneCollapseState = Record<CollapsiblePaneId, boolean>;

type AppState = {
  readonly collapsedPanes: PaneCollapseState;
  readonly shellPaneSizes: readonly number[];
  readonly workspaceColumnSizes: readonly number[];
  readonly workspaceLeftRowSizes: readonly number[];
  readonly workspaceRightRowSizes: readonly number[];
  readonly togglePaneCollapsed: (paneId: CollapsiblePaneId) => void;
  readonly setShellPaneSizes: (shellPaneSizes: readonly number[]) => void;
  readonly setWorkspaceColumnSizes: (
    workspaceColumnSizes: readonly number[],
  ) => void;
  readonly setWorkspaceLeftRowSizes: (
    workspaceLeftRowSizes: readonly number[],
  ) => void;
  readonly setWorkspaceRightRowSizes: (
    workspaceRightRowSizes: readonly number[],
  ) => void;
};

export const useAppStore = create<AppState>((set) => ({
  collapsedPanes: {
    project: false,
    source: false,
    graph: false,
    chat: false,
    render: false,
  },
  shellPaneSizes: [18, 82],
  workspaceColumnSizes: [50, 50],
  workspaceLeftRowSizes: [50, 50],
  workspaceRightRowSizes: [50, 50],
  togglePaneCollapsed: (paneId) =>
    set((state) => ({
      collapsedPanes: {
        ...state.collapsedPanes,
        [paneId]: !state.collapsedPanes[paneId],
      },
    })),
  setShellPaneSizes: (shellPaneSizes) => set({ shellPaneSizes }),
  setWorkspaceColumnSizes: (workspaceColumnSizes) =>
    set({ workspaceColumnSizes }),
  setWorkspaceLeftRowSizes: (workspaceLeftRowSizes) =>
    set({ workspaceLeftRowSizes }),
  setWorkspaceRightRowSizes: (workspaceRightRowSizes) =>
    set({ workspaceRightRowSizes }),
}));
