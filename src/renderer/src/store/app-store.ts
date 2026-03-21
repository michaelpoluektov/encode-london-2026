import { create } from "zustand";

type AppState = {
  readonly isProjectSidebarOpen: boolean;
  readonly shellPaneSizes: readonly number[];
  readonly workspaceColumnSizes: readonly number[];
  readonly workspaceLeftRowSizes: readonly number[];
  readonly workspaceRightRowSizes: readonly number[];
  readonly setProjectSidebarOpen: (isProjectSidebarOpen: boolean) => void;
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
  isProjectSidebarOpen: true,
  shellPaneSizes: [18, 82],
  workspaceColumnSizes: [50, 50],
  workspaceLeftRowSizes: [50, 50],
  workspaceRightRowSizes: [50, 50],
  setProjectSidebarOpen: (isProjectSidebarOpen) =>
    set({ isProjectSidebarOpen }),
  setShellPaneSizes: (shellPaneSizes) => set({ shellPaneSizes }),
  setWorkspaceColumnSizes: (workspaceColumnSizes) =>
    set({ workspaceColumnSizes }),
  setWorkspaceLeftRowSizes: (workspaceLeftRowSizes) =>
    set({ workspaceLeftRowSizes }),
  setWorkspaceRightRowSizes: (workspaceRightRowSizes) =>
    set({ workspaceRightRowSizes }),
}));
