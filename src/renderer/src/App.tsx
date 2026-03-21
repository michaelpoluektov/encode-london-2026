import { type JSX, useEffect, useRef } from "react";
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
import { useAppStore } from "./store/app-store";
import { usePreviewStore } from "./store/preview-store";
import { useProjectStore } from "./store/project-store";

const normalizePaneSizes = (sizes: readonly number[]): number[] => {
  const total = sizes.reduce((sum, size) => sum + size, 0);

  if (total <= 0) {
    return sizes.map(() => 100 / sizes.length);
  }

  return sizes.map((size) => (size / total) * 100);
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

  const isSourceCollapseDisabled =
    collapsedPanes.graph && !collapsedPanes.source;
  const isGraphCollapseDisabled =
    collapsedPanes.source && !collapsedPanes.graph;
  const isChatCollapseDisabled = collapsedPanes.render && !collapsedPanes.chat;
  const isRenderCollapseDisabled =
    collapsedPanes.chat && !collapsedPanes.render;

  const workspaceGridShell = (
    <div className={workspaceGrid}>
      <SplitLayout
        defaultSizes={normalizePaneSizes(workspaceColumnSizes)}
        onChange={setWorkspaceColumnSizes}
        panes={[
          {
            content: (
              <div className={workspaceColumn}>
                {collapsedPanes.source ? (
                  <PaneRestoreControl
                    label="Source"
                    placement="topRight"
                    onRestore={() => {
                      togglePaneCollapsed("source");
                    }}
                  />
                ) : null}
                {collapsedPanes.graph ? (
                  <PaneRestoreControl
                    label="Graph"
                    placement="bottomRight"
                    onRestore={() => {
                      togglePaneCollapsed("graph");
                    }}
                  />
                ) : null}
                <SplitLayout
                  defaultSizes={normalizePaneSizes(workspaceLeftRowSizes)}
                  onChange={(sizes) => {
                    if (collapsedPanes.source || collapsedPanes.graph) {
                      return;
                    }

                    setWorkspaceLeftRowSizes(sizes);
                  }}
                  orientation="vertical"
                  panes={[
                    {
                      content: (
                        <Panel
                          collapseDisabled={isSourceCollapseDisabled}
                          label="Source"
                          onToggleCollapsed={() => {
                            togglePaneCollapsed("source");
                          }}
                        >
                          <ShaderEditor />
                        </Panel>
                      ),
                      id: "source-panel",
                      minSize: 220,
                      preferredSize: `${workspaceLeftRowSizes[0]}%`,
                      visible: !collapsedPanes.source,
                    },
                    {
                      content: (
                        <Panel
                          collapseDisabled={isGraphCollapseDisabled}
                          label="Graph"
                          onToggleCollapsed={() => {
                            togglePaneCollapsed("graph");
                          }}
                        >
                          <GraphPanel />
                        </Panel>
                      ),
                      id: "graph-panel",
                      minSize: 180,
                      preferredSize: `${workspaceLeftRowSizes[1]}%`,
                      visible: !collapsedPanes.graph,
                    },
                  ]}
                />
              </div>
            ),
            id: "workspace-left-column",
            minSize: 360,
            preferredSize: `${workspaceColumnSizes[0]}%`,
          },
          {
            content: (
              <div className={workspaceColumn}>
                {collapsedPanes.chat ? (
                  <PaneRestoreControl
                    label="Chat"
                    placement="topRight"
                    onRestore={() => {
                      togglePaneCollapsed("chat");
                    }}
                  />
                ) : null}
                {collapsedPanes.render ? (
                  <PaneRestoreControl
                    label="Render"
                    placement="bottomRight"
                    onRestore={() => {
                      togglePaneCollapsed("render");
                    }}
                  />
                ) : null}
                <SplitLayout
                  defaultSizes={normalizePaneSizes(workspaceRightRowSizes)}
                  onChange={(sizes) => {
                    if (collapsedPanes.chat || collapsedPanes.render) {
                      return;
                    }

                    setWorkspaceRightRowSizes(sizes);
                  }}
                  orientation="vertical"
                  panes={[
                    {
                      content: (
                        <Panel
                          collapseDisabled={isChatCollapseDisabled}
                          label="Chat"
                          onToggleCollapsed={() => {
                            togglePaneCollapsed("chat");
                          }}
                        >
                          <ChatPanel />
                        </Panel>
                      ),
                      id: "chat-panel",
                      minSize: 220,
                      preferredSize: `${workspaceRightRowSizes[0]}%`,
                      visible: !collapsedPanes.chat,
                    },
                    {
                      content: (
                        <Panel
                          collapseDisabled={isRenderCollapseDisabled}
                          label="Render"
                          onToggleCollapsed={() => {
                            togglePaneCollapsed("render");
                          }}
                        >
                          <PreviewViewport />
                        </Panel>
                      ),
                      id: "render-panel",
                      minSize: 220,
                      preferredSize: `${workspaceRightRowSizes[1]}%`,
                      visible: !collapsedPanes.render,
                    },
                  ]}
                />
              </div>
            ),
            id: "workspace-right-column",
            minSize: 360,
            preferredSize: `${workspaceColumnSizes[1]}%`,
          },
        ]}
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
              className={cx(
                footerStatusDot,
                isPreviewStale && footerStatusDotDirty,
              )}
            />
            {isPreviewStale ? "Render stale" : "Render clean"}
          </Button>
          {isPreviewStale &&
          isPreviewDiagnosticOpen &&
          previewDiagnostic !== null ? (
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
      </footer>
    </main>
  );
};
