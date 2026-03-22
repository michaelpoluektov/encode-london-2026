import {
  type ComponentProps,
  type JSX,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { normalizeProjectPath } from "../../shared/path-utils";
import {
  appShell,
  layoutViewport,
  layoutViewportProjectCollapsed,
  workspaceColumn,
  workspaceColumnWithTopRestore,
  workspaceGrid,
  workspaceGridChatCollapsed,
  workspaceShell,
} from "./app-shell.css";
import { ChatPanel } from "./components/ChatPanel";
import { GraphEditor } from "./components/GraphEditor";
import { Panel } from "./components/Panel";
import { PaneRestoreControl } from "./components/PaneRestoreControl";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ShaderEditor } from "./components/ShaderEditor";
import { SplitLayout } from "./components/SplitLayout";
import { Button } from "./components/ui/Button";
import {
  CaptureIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
} from "./components/ui/icons";
import { cx } from "./lib/cx";
import { captureRegisteredPreview } from "./preview-capture";
import {
  type CollapsiblePaneId,
  createProjectLayoutSnapshot,
  useAppStore,
} from "./store/app-store";
import { useProjectStore } from "./store/project-store";

const normalizePaneSizes = (sizes: readonly number[]): number[] => {
  const total = sizes.reduce((sum, size) => sum + size, 0);

  if (total <= 0) {
    return sizes.map(() => 100 / sizes.length);
  }

  return sizes.map((size) => (size / total) * 100);
};

const toPaneSizePair = (sizes: readonly number[]): [number, number] => [
  sizes[0] ?? 50,
  sizes[1] ?? 50,
];

type WorkspacePaneId = Exclude<CollapsiblePaneId, "project">;
type RestorePlacement = ComponentProps<typeof PaneRestoreControl>["placement"];

type WorkspacePaneConfig = {
  readonly id: string;
  readonly paneId: WorkspacePaneId;
  readonly label: string;
  readonly content: JSX.Element;
  readonly minSize: number;
  readonly restorePlacement: RestorePlacement;
};

type WorkspaceColumnLayoutProps = {
  readonly layoutRevision: number;
  readonly panes: readonly [WorkspacePaneConfig, WorkspacePaneConfig];
  readonly rowSizes: readonly number[];
  readonly onDragEnd: () => void;
  readonly onRowSizesChange: (sizes: number[]) => void;
  readonly collapsedPanes: Record<CollapsiblePaneId, boolean>;
  readonly togglePaneCollapsed: (paneId: CollapsiblePaneId) => void;
};

const isPaneCollapseDisabled = (
  collapsedPanes: Record<CollapsiblePaneId, boolean>,
  paneId: WorkspacePaneId,
  siblingPaneId: WorkspacePaneId,
): boolean => collapsedPanes[siblingPaneId] && !collapsedPanes[paneId];

const WorkspaceColumnLayout = ({
  layoutRevision,
  panes,
  rowSizes,
  onDragEnd,
  onRowSizesChange,
  collapsedPanes,
  togglePaneCollapsed,
}: WorkspaceColumnLayoutProps): JSX.Element => {
  const [topPane, bottomPane] = panes;
  const hasCollapsedPane = panes.some((pane) => collapsedPanes[pane.paneId]);

  return (
    <div
      className={cx(
        workspaceColumn,
        collapsedPanes[topPane.paneId] && workspaceColumnWithTopRestore,
      )}
    >
      {panes.map((pane) =>
        collapsedPanes[pane.paneId] ? (
          <PaneRestoreControl
            key={`${pane.id}-restore`}
            label={pane.label}
            placement={pane.restorePlacement}
            restoreIcon={<ChevronRightIcon />}
            onRestore={() => {
              togglePaneCollapsed(pane.paneId);
            }}
          />
        ) : null,
      )}
      <SplitLayout
        key={`${layoutRevision}-${topPane.id}-${bottomPane.id}`}
        defaultSizes={normalizePaneSizes(rowSizes)}
        onChange={(sizes) => {
          if (hasCollapsedPane) {
            return;
          }

          onRowSizesChange(sizes);
        }}
        onDragEnd={onDragEnd}
        orientation="vertical"
        panes={[
          {
            content: <Panel label={topPane.label}>{topPane.content}</Panel>,
            id: topPane.id,
            minSize: topPane.minSize,
            preferredSize: `${rowSizes[0]}%`,
            visible: !collapsedPanes[topPane.paneId],
          },
          {
            content: (
              <Panel label={bottomPane.label}>{bottomPane.content}</Panel>
            ),
            id: bottomPane.id,
            minSize: bottomPane.minSize,
            preferredSize: `${rowSizes[1]}%`,
            visible: !collapsedPanes[bottomPane.paneId],
          },
        ]}
      />
    </div>
  );
};

export const App = (): JSX.Element => {
  const hasBootstrappedRef = useRef(false);
  const hydratedProjectIdRef = useRef<string | null>(null);
  const activeProjectIdRef = useRef<string | null>(null);
  const layoutSnapshotRef = useRef(
    createProjectLayoutSnapshot({
      collapsedPanes: useAppStore.getState().collapsedPanes,
      shellPaneSizes: useAppStore.getState().shellPaneSizes,
      workspaceColumnSizes: useAppStore.getState().workspaceColumnSizes,
      workspaceLeftRowSizes: useAppStore.getState().workspaceLeftRowSizes,
    }),
  );
  const pendingLayoutSnapshotRef = useRef<ReturnType<
    typeof createProjectLayoutSnapshot
  > | null>(null);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const openProject = useProjectStore((state) => state.openProject);
  const projectId = useProjectStore(
    (state) => state.project?.manifest.projectId ?? null,
  );
  const collapsedPanes = useAppStore((state) => state.collapsedPanes);
  const replaceProjectLayout = useAppStore(
    (state) => state.replaceProjectLayout,
  );
  const togglePaneCollapsed = useAppStore((state) => state.togglePaneCollapsed);
  const shellPaneSizes = useAppStore((state) => state.shellPaneSizes);
  const setShellPaneSizes = useAppStore((state) => state.setShellPaneSizes);
  const workspaceColumnSizes = useAppStore(
    (state) => state.workspaceColumnSizes,
  );
  const setWorkspaceColumnSizes = useAppStore(
    (state) => state.setWorkspaceColumnSizes,
  );
  const workspaceLeftRowSizes = useAppStore(
    (state) => state.workspaceLeftRowSizes,
  );
  const setWorkspaceLeftRowSizes = useAppStore(
    (state) => state.setWorkspaceLeftRowSizes,
  );

  const createLayoutSnapshot = (
    overrides: Partial<ReturnType<typeof createProjectLayoutSnapshot>> = {},
  ): ReturnType<typeof createProjectLayoutSnapshot> =>
    createProjectLayoutSnapshot({
      collapsedPanes: overrides.collapsedPanes ?? collapsedPanes,
      shellPaneSizes: overrides.shellPaneSizes ?? shellPaneSizes,
      workspaceColumnSizes:
        overrides.workspaceColumnSizes ?? workspaceColumnSizes,
      workspaceLeftRowSizes:
        overrides.workspaceLeftRowSizes ?? workspaceLeftRowSizes,
    });

  layoutSnapshotRef.current = createLayoutSnapshot();

  const hydrateProjectLayout = useEffectEvent(async (nextProjectId: string) => {
    hydratedProjectIdRef.current = null;
    pendingLayoutSnapshotRef.current = null;
    replaceProjectLayout(null);
    setLayoutRevision((revision) => revision + 1);

    const layout = await window.shadily.project.getLayout(nextProjectId);

    if (activeProjectIdRef.current !== nextProjectId) {
      return;
    }

    pendingLayoutSnapshotRef.current = null;
    replaceProjectLayout(layout);
    hydratedProjectIdRef.current = nextProjectId;
    setLayoutRevision((revision) => revision + 1);
  });

  const persistProjectLayout = useEffectEvent(async () => {
    if (projectId === null || hydratedProjectIdRef.current !== projectId) {
      return;
    }

    const layout =
      pendingLayoutSnapshotRef.current ?? layoutSnapshotRef.current;

    pendingLayoutSnapshotRef.current = null;

    await window.shadily.project.saveLayout({
      projectId,
      layout,
    });
  });

  const handleTogglePaneCollapsed = (paneId: CollapsiblePaneId): void => {
    pendingLayoutSnapshotRef.current = createLayoutSnapshot({
      collapsedPanes: {
        ...collapsedPanes,
        [paneId]: !collapsedPanes[paneId],
      },
    });
    togglePaneCollapsed(paneId);
    void persistProjectLayout();
  };

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;

    void window.shadily.getBootstrapPayload().then((payload) => {
      if (payload.initialProject !== null) {
        openProject(payload.initialProject);
      }
    });
  }, [openProject]);

  useEffect(() => {
    activeProjectIdRef.current = projectId;

    if (projectId === null) {
      hydratedProjectIdRef.current = null;
      pendingLayoutSnapshotRef.current = null;
      replaceProjectLayout(null);
      setLayoutRevision((revision) => revision + 1);
      return;
    }

    void hydrateProjectLayout(projectId);
  }, [projectId, replaceProjectLayout]);

  const handleShellPaneSizesChange = (sizes: number[]): void => {
    setShellPaneSizes(sizes);
    pendingLayoutSnapshotRef.current = createLayoutSnapshot({
      shellPaneSizes: toPaneSizePair(sizes),
    });
  };

  const handleWorkspaceColumnSizesChange = (sizes: number[]): void => {
    setWorkspaceColumnSizes(sizes);
    pendingLayoutSnapshotRef.current = createLayoutSnapshot({
      workspaceColumnSizes: toPaneSizePair(sizes),
    });
  };

  const handleWorkspaceLeftRowSizesChange = (sizes: number[]): void => {
    setWorkspaceLeftRowSizes(sizes);
    pendingLayoutSnapshotRef.current = createLayoutSnapshot({
      workspaceLeftRowSizes: toPaneSizePair(sizes),
    });
  };

  const project = useProjectStore((state) => state.project);
  const openTab = useProjectStore((state) => state.openTab);
  const refreshProject = useProjectStore((state) => state.refreshProject);
  const setSavedDocument = useProjectStore((state) => state.setSavedDocument);

  const handleCapture = useCallback(async () => {
    const currentProject = useProjectStore.getState().project;

    if (currentProject === null) {
      return;
    }

    const captureResult = await captureRegisteredPreview();

    if (captureResult.kind === "error") {
      return;
    }

    const { imagePath } = await window.shadily.project.saveCapture({
      folderPath: currentProject.folderPath,
      dataUrl: captureResult.dataUrl,
    });

    const freshProject = await window.shadily.project.reload(
      currentProject.folderPath,
    );

    refreshProject(freshProject);

    const folderNorm = normalizeProjectPath(currentProject.folderPath);
    const separator = folderNorm.endsWith("/") ? "" : "/";
    const relativePath = normalizeProjectPath(imagePath).replace(
      `${folderNorm}${separator}`,
      "",
    );

    // Use the dataUrl we already have in memory — file:// URLs don't work
    // in the renderer when running from the dev server (HTTP origin).
    setSavedDocument({
      path: relativePath,
      kind: "image",
      isEditable: false,
      sourceUrl: captureResult.dataUrl,
    });
    openTab(relativePath);
  }, [openTab, refreshProject, setSavedDocument]);

  const graphCollapseDisabled = isPaneCollapseDisabled(
    collapsedPanes,
    "graph",
    "source",
  );
  const sourceCollapseDisabled = isPaneCollapseDisabled(
    collapsedPanes,
    "source",
    "graph",
  );
  const projectHeaderActions = (
    <Button
      aria-label="Collapse Project"
      onClick={() => {
        handleTogglePaneCollapsed("project");
      }}
      size="sm"
      square
      variant="plain"
    >
      <ChevronLeftIcon />
    </Button>
  );

  const graphPreviewHeaderActions = (
    <Button
      aria-label="Capture preview"
      disabled={project === null}
      onClick={() => {
        void handleCapture();
      }}
      size="xs"
      square
      variant="plain"
    >
      <CaptureIcon />
    </Button>
  );

  const graphCollapseAction = (
    <Button
      aria-label="Collapse Graph"
      disabled={graphCollapseDisabled}
      onClick={() => {
        handleTogglePaneCollapsed("graph");
      }}
      size="sm"
      square
      variant="plain"
    >
      <MinusIcon />
    </Button>
  );

  const sourceHeaderActions = (
    <Button
      aria-label="Collapse Source"
      disabled={sourceCollapseDisabled}
      onClick={() => {
        handleTogglePaneCollapsed("source");
      }}
      size="sm"
      square
      variant="plain"
    >
      <MinusIcon />
    </Button>
  );

  const chatHeaderActions = (
    <Button
      aria-label="Collapse Chat"
      onClick={() => {
        handleTogglePaneCollapsed("chat");
      }}
      size="sm"
      square
      variant="plain"
    >
      <ChevronRightIcon />
    </Button>
  );

  const leftColumnPanes = [
    {
      content: (
        <GraphEditor
          collapseAction={graphCollapseAction}
          previewHeaderActions={graphPreviewHeaderActions}
          sourceCollapsed={collapsedPanes.source}
        />
      ),
      id: "graph-panel",
      label: "Graph",
      minSize: 180,
      paneId: "graph",
      restorePlacement: "topRight",
    },
    {
      content: <ShaderEditor headerActions={sourceHeaderActions} />,
      id: "source-panel",
      label: "Source",
      minSize: 220,
      paneId: "source",
      restorePlacement: "bottomRight",
    },
  ] as const;

  const workspaceGridShell = (
    <div className={cx(workspaceGrid, collapsedPanes.chat && workspaceGridChatCollapsed)}>
      {collapsedPanes.chat && (
        <PaneRestoreControl
          label="Chat"
          placement="rightCenter"
          restoreIcon={<ChevronLeftIcon />}
          onRestore={() => {
            handleTogglePaneCollapsed("chat");
          }}
        />
      )}
      <SplitLayout
        key={`workspace-${layoutRevision}`}
        defaultSizes={normalizePaneSizes(workspaceColumnSizes)}
        onChange={(sizes) => {
          if (collapsedPanes.chat) {
            return;
          }
          handleWorkspaceColumnSizesChange(sizes);
        }}
        onDragEnd={() => {
          void persistProjectLayout();
        }}
        panes={[
          {
            content: (
              <WorkspaceColumnLayout
                collapsedPanes={collapsedPanes}
                layoutRevision={layoutRevision}
                onDragEnd={() => {
                  void persistProjectLayout();
                }}
                onRowSizesChange={handleWorkspaceLeftRowSizesChange}
                panes={leftColumnPanes}
                rowSizes={workspaceLeftRowSizes}
                togglePaneCollapsed={handleTogglePaneCollapsed}
              />
            ),
            id: "workspace-left-column",
            minSize: 360,
            preferredSize: `${workspaceColumnSizes[0]}%`,
          },
          {
            content: (
              <div className={workspaceColumn}>
                <Panel label="Chat">
                  <ChatPanel headerActions={chatHeaderActions} />
                </Panel>
              </div>
            ),
            id: "workspace-right-column",
            minSize: 360,
            preferredSize: `${workspaceColumnSizes[1]}%`,
            visible: !collapsedPanes.chat,
          },
        ]}
      />
    </div>
  );

  return (
    <main className={appShell}>
      <section className={cx(layoutViewport, collapsedPanes.project && layoutViewportProjectCollapsed)}>
        {collapsedPanes.project ? (
          <PaneRestoreControl
            label="Project"
            placement="leftCenter"
            restoreIcon={<ChevronRightIcon />}
            onRestore={() => {
              handleTogglePaneCollapsed("project");
            }}
          />
        ) : null}
        <SplitLayout
          key={`shell-${layoutRevision}`}
          defaultSizes={normalizePaneSizes(shellPaneSizes)}
          onDragEnd={() => {
            void persistProjectLayout();
          }}
          onChange={(sizes) => {
            if (collapsedPanes.project) {
              return;
            }

            handleShellPaneSizesChange(sizes);
          }}
          panes={[
            {
              content: (
                <Panel label="Project">
                  <ProjectSidebar headerActions={projectHeaderActions} />
                </Panel>
              ),
              id: "project-sidebar",
              minSize: 220,
              preferredSize: `${shellPaneSizes[0]}%`,
              visible: !collapsedPanes.project,
            },
            {
              content: (
                <div className={workspaceShell}>{workspaceGridShell}</div>
              ),
              id: "workspace-shell",
              minSize: 720,
              preferredSize: `${shellPaneSizes[1]}%`,
            },
          ]}
        />
      </section>
    </main>
  );
};
