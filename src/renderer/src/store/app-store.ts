import { create } from "zustand";
import type { BootstrapPayload } from "../../../shared/contracts";
import { STARTER_FRAGMENT_SHADER } from "../shader-source";

export const WORKSPACE_PANEL_IDS = ["source", "preview", "chat"] as const;
export type WorkspacePanelId = (typeof WORKSPACE_PANEL_IDS)[number];

export const WORKSPACE_REGION_IDS = ["main", "side", "bottom"] as const;
export type WorkspaceRegionId = (typeof WORKSPACE_REGION_IDS)[number];

export const workspacePanelDefinitions = {
  source: {
    description: "Shader source editor",
    title: "Source",
  },
  preview: {
    description: "Live material preview",
    title: "Preview",
  },
  chat: {
    description: "LLM chat workspace",
    title: "Chat",
  },
} as const satisfies Record<
  WorkspacePanelId,
  {
    readonly description: string;
    readonly title: string;
  }
>;

export const workspaceRegionDefinitions = {
  main: { label: "Main" },
  side: { label: "Side" },
  bottom: { label: "Bottom" },
} as const satisfies Record<
  WorkspaceRegionId,
  {
    readonly label: string;
  }
>;

type WorkspacePanelLayout = {
  readonly isOpen: boolean;
  readonly region: WorkspaceRegionId;
};

type WorkspacePanelsState = Record<WorkspacePanelId, WorkspacePanelLayout>;

type ActiveWorkspacePanelsState = Record<
  WorkspaceRegionId,
  WorkspacePanelId | null
>;

const defaultWorkspacePanels = {
  source: {
    isOpen: true,
    region: "main",
  },
  preview: {
    isOpen: true,
    region: "bottom",
  },
  chat: {
    isOpen: true,
    region: "side",
  },
} as const satisfies WorkspacePanelsState;

const getOpenWorkspacePanelIds = (
  workspacePanels: WorkspacePanelsState,
  region: WorkspaceRegionId,
): WorkspacePanelId[] =>
  WORKSPACE_PANEL_IDS.filter((panelId) => {
    const panel = workspacePanels[panelId];
    return panel.isOpen && panel.region === region;
  });

const deriveActiveWorkspacePanels = (
  workspacePanels: WorkspacePanelsState,
  previousActiveWorkspacePanels: ActiveWorkspacePanelsState,
  preferredPanels: Partial<
    Record<WorkspaceRegionId, WorkspacePanelId | null>
  > = {},
): ActiveWorkspacePanelsState => {
  const deriveRegionActivePanel = (
    region: WorkspaceRegionId,
  ): WorkspacePanelId | null => {
    const openPanelIds = getOpenWorkspacePanelIds(workspacePanels, region);
    const preferredPanelId = preferredPanels[region];

    if (
      preferredPanelId !== undefined &&
      preferredPanelId !== null &&
      openPanelIds.includes(preferredPanelId)
    ) {
      return preferredPanelId;
    }

    const previousPanelId = previousActiveWorkspacePanels[region];

    if (previousPanelId !== null && openPanelIds.includes(previousPanelId)) {
      return previousPanelId;
    }

    return openPanelIds[0] ?? null;
  };

  return {
    bottom: deriveRegionActivePanel("bottom"),
    main: deriveRegionActivePanel("main"),
    side: deriveRegionActivePanel("side"),
  };
};

const defaultActiveWorkspacePanels = deriveActiveWorkspacePanels(
  defaultWorkspacePanels,
  {
    bottom: null,
    main: null,
    side: null,
  },
  {
    bottom: "preview",
    main: "source",
    side: "chat",
  },
);

type AppState = {
  readonly bootstrap: BootstrapPayload | null;
  readonly shaderSource: string;
  readonly shellPaneSizes: readonly number[];
  readonly workspaceColumnSizes: readonly number[];
  readonly workspaceRowSizes: readonly number[];
  readonly workspacePanels: WorkspacePanelsState;
  readonly activeWorkspacePanels: ActiveWorkspacePanelsState;
  readonly setBootstrap: (bootstrap: BootstrapPayload) => void;
  readonly setShaderSource: (shaderSource: string) => void;
  readonly setShellPaneSizes: (shellPaneSizes: readonly number[]) => void;
  readonly setWorkspaceColumnSizes: (
    workspaceColumnSizes: readonly number[],
  ) => void;
  readonly setWorkspaceRowSizes: (workspaceRowSizes: readonly number[]) => void;
  readonly setActiveWorkspacePanel: (
    region: WorkspaceRegionId,
    panelId: WorkspacePanelId,
  ) => void;
  readonly toggleWorkspacePanel: (panelId: WorkspacePanelId) => void;
  readonly moveWorkspacePanel: (
    panelId: WorkspacePanelId,
    region: WorkspaceRegionId,
  ) => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeWorkspacePanels: defaultActiveWorkspacePanels,
  bootstrap: null,
  shellPaneSizes: [18, 82],
  shaderSource: STARTER_FRAGMENT_SHADER,
  workspaceColumnSizes: [72, 28],
  workspacePanels: defaultWorkspacePanels,
  workspaceRowSizes: [66, 34],
  setBootstrap: (bootstrap) => set({ bootstrap }),
  setShaderSource: (shaderSource) => set({ shaderSource }),
  setShellPaneSizes: (shellPaneSizes) => set({ shellPaneSizes }),
  setWorkspaceColumnSizes: (workspaceColumnSizes) =>
    set({ workspaceColumnSizes }),
  setWorkspaceRowSizes: (workspaceRowSizes) => set({ workspaceRowSizes }),
  setActiveWorkspacePanel: (region, panelId) =>
    set((state) => {
      const panel = state.workspacePanels[panelId];

      if (!panel.isOpen || panel.region !== region) {
        return state;
      }

      return {
        activeWorkspacePanels: {
          ...state.activeWorkspacePanels,
          [region]: panelId,
        },
      };
    }),
  toggleWorkspacePanel: (panelId) =>
    set((state) => {
      const currentPanel = state.workspacePanels[panelId];
      const workspacePanels: WorkspacePanelsState = {
        ...state.workspacePanels,
        [panelId]: {
          ...currentPanel,
          isOpen: !currentPanel.isOpen,
        },
      };

      return {
        activeWorkspacePanels: deriveActiveWorkspacePanels(
          workspacePanels,
          state.activeWorkspacePanels,
          currentPanel.isOpen
            ? {}
            : {
                [currentPanel.region]: panelId,
              },
        ),
        workspacePanels,
      };
    }),
  moveWorkspacePanel: (panelId, region) =>
    set((state) => {
      const currentPanel = state.workspacePanels[panelId];
      const workspacePanels: WorkspacePanelsState = {
        ...state.workspacePanels,
        [panelId]: {
          isOpen: true,
          region,
        },
      };

      if (currentPanel.isOpen && currentPanel.region === region) {
        return {
          activeWorkspacePanels: {
            ...state.activeWorkspacePanels,
            [region]: panelId,
          },
        };
      }

      return {
        activeWorkspacePanels: deriveActiveWorkspacePanels(
          workspacePanels,
          state.activeWorkspacePanels,
          {
            [region]: panelId,
          },
        ),
        workspacePanels,
      };
    }),
}));
