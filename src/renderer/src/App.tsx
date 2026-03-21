import {
  type ComponentProps,
  type JSX,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {
  appShell,
  footerBar,
  footerDiagnosticMessage,
  footerDiagnosticMeta,
  footerDiagnosticPopover,
  footerStatusButton,
  footerStatusButtonDirty,
  footerStatusDot,
  footerStatusDotDirty,
  layoutViewport,
  shellFrame,
  workspaceColumn,
  workspaceGrid,
  workspaceShell,
} from "./app-shell.css";
import { ChatPanel } from "./components/ChatPanel";
import { GraphPanel } from "./components/GraphPanel";
import { Panel } from "./components/Panel";
import type { PanelHeaderAction } from "./components/Panel";
import { PaneRestoreControl } from "./components/PaneRestoreControl";
import { PreviewViewport } from "./components/PreviewViewport";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ShaderEditor } from "./components/ShaderEditor";
import { SplitLayout } from "./components/SplitLayout";
import { Button } from "./components/ui/Button";
import { Text } from "./components/ui/Text";
import { cx } from "./lib/cx";
import { captureRegisteredPreview } from "./preview-capture";
import {
  type CollapsiblePaneId,
  createProjectLayoutSnapshot,
  useAppStore,
} from "./store/app-store";
import { getPreviewDiagnostic, usePreviewStore } from "./store/preview-store";
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
  readonly headerActions?: readonly PanelHeaderAction[];
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

type FooterStatusProps = {
  readonly isPreviewDiagnosticOpen: boolean;
  readonly isPreviewStale: boolean;
  readonly previewDiagnostic: ReturnType<typeof getPreviewDiagnostic>;
  readonly togglePreviewDiagnosticOpen: () => void;
};

const getPreviewStatusLabel = (
  isPreviewStale: boolean,
  hasDiagnostic: boolean,
): string => {
  if (isPreviewStale) {
    return "Render stale";
  }

  if (hasDiagnostic) {
    return "Preview issue";
  }

  return "Render clean";
};

const isPaneCollapseDisabled = (
  collapsedPanes: Record<CollapsiblePaneId, boolean>,
  paneId: WorkspacePaneId,
  siblingPaneId: WorkspacePaneId,
): boolean => collapsedPanes[siblingPaneId] && !collapsedPanes[paneId];

const FooterStatus = ({
  isPreviewDiagnosticOpen,
  isPreviewStale,
  previewDiagnostic,
  togglePreviewDiagnosticOpen,
}: FooterStatusProps): JSX.Element => {
  const hasPreviewDiagnostic = previewDiagnostic !== null;
  const hasPreviewIssue = hasPreviewDiagnostic || isPreviewStale;

  return (
    <div className={shellFrame}>
      <Button
        aria-controls="preview-diagnostic"
        aria-expanded={hasPreviewDiagnostic && isPreviewDiagnosticOpen}
        className={cx(
          footerStatusButton,
          hasPreviewIssue && footerStatusButtonDirty,
        )}
        disabled={!hasPreviewDiagnostic}
        onClick={() => {
          if (!hasPreviewDiagnostic) {
            return;
          }

          togglePreviewDiagnosticOpen();
        }}
        variant="plain"
      >
        <span
          aria-hidden="true"
          className={cx(
            footerStatusDot,
            hasPreviewIssue && footerStatusDotDirty,
          )}
        />
        {getPreviewStatusLabel(isPreviewStale, hasPreviewDiagnostic)}
      </Button>
      {hasPreviewDiagnostic && isPreviewDiagnosticOpen ? (
        <div id="preview-diagnostic" className={footerDiagnosticPopover}>
          <Text as="p" tone="default" variant="label">
            Preview Diagnostic
          </Text>
          <div className={footerDiagnosticMeta}>
            <span>{previewDiagnostic.stage}</span>
            {previewDiagnostic.revision !== null ? (
              <span>Revision {previewDiagnostic.revision}</span>
            ) : null}
            <span>
              {new Date(previewDiagnostic.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <pre className={footerDiagnosticMessage}>
            {previewDiagnostic.message}
          </pre>
        </div>
      ) : null}
    </div>
  );
};

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
    <div className={workspaceColumn}>
      {panes.map((pane) =>
        collapsedPanes[pane.paneId] ? (
          <PaneRestoreControl
            key={`${pane.id}-restore`}
            label={pane.label}
            placement={pane.restorePlacement}
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
            content: (
              <Panel
                collapseDisabled={isPaneCollapseDisabled(
                  collapsedPanes,
                  topPane.paneId,
                  bottomPane.paneId,
                )}
                headerActions={topPane.headerActions}
                label={topPane.label}
                onToggleCollapsed={() => {
                  togglePaneCollapsed(topPane.paneId);
                }}
              >
                {topPane.content}
              </Panel>
            ),
            id: topPane.id,
            minSize: topPane.minSize,
            preferredSize: `${rowSizes[0]}%`,
            visible: !collapsedPanes[topPane.paneId],
          },
          {
            content: (
              <Panel
                collapseDisabled={isPaneCollapseDisabled(
                  collapsedPanes,
                  bottomPane.paneId,
                  topPane.paneId,
                )}
                headerActions={bottomPane.headerActions}
                label={bottomPane.label}
                onToggleCollapsed={() => {
                  togglePaneCollapsed(bottomPane.paneId);
                }}
              >
                {bottomPane.content}
              </Panel>
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
      workspaceRightRowSizes: useAppStore.getState().workspaceRightRowSizes,
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
  const isPreviewDiagnosticOpen = useAppStore(
    (state) => state.isPreviewDiagnosticOpen,
  );
  const replaceProjectLayout = useAppStore(
    (state) => state.replaceProjectLayout,
  );
  const togglePaneCollapsed = useAppStore((state) => state.togglePaneCollapsed);
  const togglePreviewDiagnosticOpen = useAppStore(
    (state) => state.togglePreviewDiagnosticOpen,
  );
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
  const workspaceRightRowSizes = useAppStore(
    (state) => state.workspaceRightRowSizes,
  );
  const setWorkspaceRightRowSizes = useAppStore(
    (state) => state.setWorkspaceRightRowSizes,
  );
  const previewDiagnostic = usePreviewStore(getPreviewDiagnostic);
  const isPreviewStale = usePreviewStore((state) => state.isStale);

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
      workspaceRightRowSizes:
        overrides.workspaceRightRowSizes ?? workspaceRightRowSizes,
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

  const handleWorkspaceRightRowSizesChange = (sizes: number[]): void => {
    setWorkspaceRightRowSizes(sizes);
    pendingLayoutSnapshotRef.current = createLayoutSnapshot({
      workspaceRightRowSizes: toPaneSizePair(sizes),
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

    const separator = currentProject.folderPath.endsWith("/") ? "" : "/";
    const relativePath = imagePath
      .replaceAll("\\", "/")
      .replace(
        `${currentProject.folderPath.replaceAll("\\", "/")}${separator}`,
        "",
      );

    const imageDocument = await window.shadily.project.readEntry({
      folderPath: currentProject.folderPath,
      manifest: freshProject.manifest,
      path: relativePath,
    });

    setSavedDocument(imageDocument);
    openTab(relativePath);
  }, [openTab, refreshProject, setSavedDocument]);

  const captureAction: PanelHeaderAction = {
    ariaLabel: "Capture preview",
    content: "\u2299",
    disabled: project === null,
    key: "capture",
    onClick: () => {
      void handleCapture();
    },
  };

  const workspaceColumns = [
    {
      id: "workspace-left-column",
      minSize: 360,
      panes: [
        {
          content: <ShaderEditor />,
          id: "source-panel",
          label: "Source",
          minSize: 220,
          paneId: "source",
          restorePlacement: "topRight",
        },
        {
          content: <GraphPanel />,
          id: "graph-panel",
          label: "Graph",
          minSize: 180,
          paneId: "graph",
          restorePlacement: "bottomRight",
        },
      ] as const,
      preferredSize: `${workspaceColumnSizes[0]}%`,
      rowSizes: workspaceLeftRowSizes,
      onRowSizesChange: handleWorkspaceLeftRowSizesChange,
    },
    {
      id: "workspace-right-column",
      minSize: 360,
      panes: [
        {
          content: <ChatPanel />,
          id: "chat-panel",
          label: "Chat",
          minSize: 220,
          paneId: "chat",
          restorePlacement: "topRight",
        },
        {
          content: <PreviewViewport />,
          headerActions: [captureAction],
          id: "render-panel",
          label: "Render",
          minSize: 220,
          paneId: "render",
          restorePlacement: "bottomRight",
        },
      ] as const,
      preferredSize: `${workspaceColumnSizes[1]}%`,
      rowSizes: workspaceRightRowSizes,
      onRowSizesChange: handleWorkspaceRightRowSizesChange,
    },
  ] as const;

  const workspaceGridShell = (
    <div className={workspaceGrid}>
      <SplitLayout
        key={`workspace-${layoutRevision}`}
        defaultSizes={normalizePaneSizes(workspaceColumnSizes)}
        onChange={handleWorkspaceColumnSizesChange}
        onDragEnd={() => {
          void persistProjectLayout();
        }}
        panes={workspaceColumns.map((column) => ({
          content: (
            <WorkspaceColumnLayout
              collapsedPanes={collapsedPanes}
              layoutRevision={layoutRevision}
              onDragEnd={() => {
                void persistProjectLayout();
              }}
              onRowSizesChange={column.onRowSizesChange}
              panes={column.panes}
              rowSizes={column.rowSizes}
              togglePaneCollapsed={handleTogglePaneCollapsed}
            />
          ),
          id: column.id,
          minSize: column.minSize,
          preferredSize: column.preferredSize,
        }))}
      />
    </div>
  );

  return (
    <main className={appShell}>
      <section className={layoutViewport}>
        {collapsedPanes.project ? (
          <PaneRestoreControl
            label="Project"
            placement="leftCenter"
            restoreSymbol=">"
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
                <ProjectSidebar
                  onToggleCollapsed={() => {
                    handleTogglePaneCollapsed("project");
                  }}
                />
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
      <footer className={footerBar}>
        <FooterStatus
          isPreviewDiagnosticOpen={isPreviewDiagnosticOpen}
          isPreviewStale={isPreviewStale}
          previewDiagnostic={previewDiagnostic}
          togglePreviewDiagnosticOpen={togglePreviewDiagnosticOpen}
        />
      </footer>
    </main>
  );
};
