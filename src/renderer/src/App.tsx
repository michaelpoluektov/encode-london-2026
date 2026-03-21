import { type ComponentProps, type JSX, useEffect, useRef } from "react";
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
import { PaneRestoreControl } from "./components/PaneRestoreControl";
import { PreviewViewport } from "./components/PreviewViewport";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ShaderEditor } from "./components/ShaderEditor";
import { SplitLayout } from "./components/SplitLayout";
import { Button } from "./components/ui/Button";
import { Text } from "./components/ui/Text";
import { cx } from "./lib/cx";
import { type CollapsiblePaneId, useAppStore } from "./store/app-store";
import { usePreviewStore } from "./store/preview-store";
import { useProjectStore } from "./store/project-store";

const normalizePaneSizes = (sizes: readonly number[]): number[] => {
  const total = sizes.reduce((sum, size) => sum + size, 0);

  if (total <= 0) {
    return sizes.map(() => 100 / sizes.length);
  }

  return sizes.map((size) => (size / total) * 100);
};

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
  readonly panes: readonly [WorkspacePaneConfig, WorkspacePaneConfig];
  readonly rowSizes: readonly number[];
  readonly setRowSizes: (sizes: number[]) => void;
  readonly collapsedPanes: Record<CollapsiblePaneId, boolean>;
  readonly togglePaneCollapsed: (paneId: CollapsiblePaneId) => void;
};

type FooterStatusProps = {
  readonly isPreviewDiagnosticOpen: boolean;
  readonly isPreviewStale: boolean;
  readonly previewDiagnostic: ReturnType<
    typeof usePreviewStore.getState
  >["diagnostic"];
  readonly togglePreviewDiagnosticOpen: () => void;
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
}: FooterStatusProps): JSX.Element => (
  <div className={shellFrame}>
    <Button
      aria-controls="preview-diagnostic"
      aria-expanded={isPreviewStale && isPreviewDiagnosticOpen}
      className={cx(
        footerStatusButton,
        isPreviewStale && footerStatusButtonDirty,
      )}
      disabled={!isPreviewStale}
      onClick={() => {
        if (!isPreviewStale) {
          return;
        }

        togglePreviewDiagnosticOpen();
      }}
      variant="plain"
    >
      <span
        aria-hidden="true"
        className={cx(footerStatusDot, isPreviewStale && footerStatusDotDirty)}
      />
      {isPreviewStale ? "Render stale" : "Render clean"}
    </Button>
    {isPreviewStale && isPreviewDiagnosticOpen && previewDiagnostic !== null ? (
      <div id="preview-diagnostic" className={footerDiagnosticPopover}>
        <Text as="p" tone="default" variant="label">
          Preview Diagnostic
        </Text>
        <div className={footerDiagnosticMeta}>
          <span>Revision {previewDiagnostic.revision}</span>
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

const WorkspaceColumnLayout = ({
  panes,
  rowSizes,
  setRowSizes,
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
        defaultSizes={normalizePaneSizes(rowSizes)}
        onChange={(sizes) => {
          if (hasCollapsedPane) {
            return;
          }

          setRowSizes(sizes);
        }}
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
  const openProject = useProjectStore((state) => state.openProject);
  const collapsedPanes = useAppStore((state) => state.collapsedPanes);
  const isPreviewDiagnosticOpen = useAppStore(
    (state) => state.isPreviewDiagnosticOpen,
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
  const previewDiagnostic = usePreviewStore((state) => state.diagnostic);
  const isPreviewStale = usePreviewStore((state) => state.isStale);

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
      setRowSizes: setWorkspaceLeftRowSizes,
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
          id: "render-panel",
          label: "Render",
          minSize: 220,
          paneId: "render",
          restorePlacement: "bottomRight",
        },
      ] as const,
      preferredSize: `${workspaceColumnSizes[1]}%`,
      rowSizes: workspaceRightRowSizes,
      setRowSizes: setWorkspaceRightRowSizes,
    },
  ] as const;

  const workspaceGridShell = (
    <div className={workspaceGrid}>
      <SplitLayout
        defaultSizes={normalizePaneSizes(workspaceColumnSizes)}
        onChange={setWorkspaceColumnSizes}
        panes={workspaceColumns.map((column) => ({
          content: (
            <WorkspaceColumnLayout
              collapsedPanes={collapsedPanes}
              panes={column.panes}
              rowSizes={column.rowSizes}
              setRowSizes={column.setRowSizes}
              togglePaneCollapsed={togglePaneCollapsed}
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
              togglePaneCollapsed("project");
            }}
          />
        ) : null}
        <SplitLayout
          defaultSizes={normalizePaneSizes(shellPaneSizes)}
          onChange={(sizes) => {
            if (collapsedPanes.project) {
              return;
            }

            setShellPaneSizes(sizes);
          }}
          panes={[
            {
              content: (
                <ProjectSidebar
                  onToggleCollapsed={() => {
                    togglePaneCollapsed("project");
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
