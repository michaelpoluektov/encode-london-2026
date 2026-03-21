import { create } from "zustand";
import type { ProjectLayoutState } from "../../../shared/contracts";
import { projectLayoutStateSchema } from "../../../shared/contracts";

export type CollapsiblePaneId =
  | "project"
  | "source"
  | "graph"
  | "chat"
  | "render";

type PaneCollapseState = Record<CollapsiblePaneId, boolean>;

export const DEFAULT_PROJECT_LAYOUT: ProjectLayoutState = {
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
};

export const createProjectLayoutSnapshot = (
  state: Pick<
    AppState,
    | "collapsedPanes"
    | "shellPaneSizes"
    | "workspaceColumnSizes"
    | "workspaceLeftRowSizes"
    | "workspaceRightRowSizes"
  >,
): ProjectLayoutState =>
  projectLayoutStateSchema.parse({
    collapsedPanes: state.collapsedPanes,
    shellPaneSizes: state.shellPaneSizes,
    workspaceColumnSizes: state.workspaceColumnSizes,
    workspaceLeftRowSizes: state.workspaceLeftRowSizes,
    workspaceRightRowSizes: state.workspaceRightRowSizes,
  });

type AppState = {
  readonly collapsedPanes: PaneCollapseState;
  readonly isPreviewDiagnosticOpen: boolean;
  readonly shellPaneSizes: readonly number[];
  readonly workspaceColumnSizes: readonly number[];
  readonly workspaceLeftRowSizes: readonly number[];
  readonly workspaceRightRowSizes: readonly number[];
  readonly togglePreviewDiagnosticOpen: () => void;
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
  readonly replaceProjectLayout: (layout: ProjectLayoutState | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  collapsedPanes: DEFAULT_PROJECT_LAYOUT.collapsedPanes,
  isPreviewDiagnosticOpen: false,
  shellPaneSizes: DEFAULT_PROJECT_LAYOUT.shellPaneSizes,
  workspaceColumnSizes: DEFAULT_PROJECT_LAYOUT.workspaceColumnSizes,
  workspaceLeftRowSizes: DEFAULT_PROJECT_LAYOUT.workspaceLeftRowSizes,
  workspaceRightRowSizes: DEFAULT_PROJECT_LAYOUT.workspaceRightRowSizes,
  togglePreviewDiagnosticOpen: () =>
    set((state) => ({
      isPreviewDiagnosticOpen: !state.isPreviewDiagnosticOpen,
    })),
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
  replaceProjectLayout: (layout) => {
    const nextLayout = layout ?? DEFAULT_PROJECT_LAYOUT;
    set({
      collapsedPanes: nextLayout.collapsedPanes,
      shellPaneSizes: nextLayout.shellPaneSizes,
      workspaceColumnSizes: nextLayout.workspaceColumnSizes,
      workspaceLeftRowSizes: nextLayout.workspaceLeftRowSizes,
      workspaceRightRowSizes: nextLayout.workspaceRightRowSizes,
    });
  },
}));
