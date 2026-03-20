import { type JSX, useEffect } from "react";
import {
  appShell,
  footerBar,
  headerActions,
  headerBar,
  layoutViewport,
  panelToggle,
  panelToggleActive,
  panelToggleGroup,
  shellFrame,
  shellTitle,
  workspaceShell,
} from "./app-shell.css";
import { ChatPanel } from "./components/ChatPanel";
import { PreviewViewport } from "./components/PreviewViewport";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ShaderEditor } from "./components/ShaderEditor";
import { SplitLayout } from "./components/SplitLayout";
import { WorkspaceRegion } from "./components/WorkspaceRegion";
import {
  useAppStore,
  WORKSPACE_PANEL_IDS,
  type WorkspacePanelId,
  type WorkspaceRegionId,
  workspacePanelDefinitions,
  workspaceRegionDefinitions,
} from "./store/app-store";

const normalizePaneSizes = (sizes: readonly number[]): number[] => {
  const total = sizes.reduce((sum, size) => sum + size, 0);

  if (total <= 0) {
    return sizes.map(() => 100 / sizes.length);
  }

  return sizes.map((size) => (size / total) * 100);
};

const getRegionPanelIds = (
  workspacePanels: ReturnType<typeof useAppStore.getState>["workspacePanels"],
  region: WorkspaceRegionId,
): WorkspacePanelId[] =>
  WORKSPACE_PANEL_IDS.filter((panelId) => {
    const panel = workspacePanels[panelId];
    return panel.isOpen && panel.region === region;
  });

export const App = (): JSX.Element => {
  const setBootstrap = useAppStore((state) => state.setBootstrap);
  const shellPaneSizes = useAppStore((state) => state.shellPaneSizes);
  const setShellPaneSizes = useAppStore((state) => state.setShellPaneSizes);
  const workspaceColumnSizes = useAppStore(
    (state) => state.workspaceColumnSizes,
  );
  const setWorkspaceColumnSizes = useAppStore(
    (state) => state.setWorkspaceColumnSizes,
  );
  const workspaceRowSizes = useAppStore((state) => state.workspaceRowSizes);
  const setWorkspaceRowSizes = useAppStore(
    (state) => state.setWorkspaceRowSizes,
  );
  const workspacePanels = useAppStore((state) => state.workspacePanels);
  const activeWorkspacePanels = useAppStore(
    (state) => state.activeWorkspacePanels,
  );
  const toggleWorkspacePanel = useAppStore(
    (state) => state.toggleWorkspacePanel,
  );
  const moveWorkspacePanel = useAppStore((state) => state.moveWorkspacePanel);
  const setActiveWorkspacePanel = useAppStore(
    (state) => state.setActiveWorkspacePanel,
  );

  useEffect(() => {
    void window.shadily.getBootstrapPayload().then(setBootstrap);
  }, [setBootstrap]);

  const sidePanelIds = getRegionPanelIds(workspacePanels, "side");
  const bottomPanelIds = getRegionPanelIds(workspacePanels, "bottom");

  const renderWorkspacePanel = (panelId: WorkspacePanelId): JSX.Element => {
    switch (panelId) {
      case "chat":
        return <ChatPanel />;
      case "preview":
        return <PreviewViewport />;
      case "source":
        return <ShaderEditor />;
    }
  };

  const renderWorkspaceRegion = (region: WorkspaceRegionId): JSX.Element => {
    const panelIds = getRegionPanelIds(workspacePanels, region);
    const activePanelId = activeWorkspacePanels[region];

    return (
      <WorkspaceRegion
        activePanelId={activePanelId}
        panelIds={panelIds}
        region={region}
        regionLabel={workspaceRegionDefinitions[region].label}
        renderPanelTitle={(panelId) => workspacePanelDefinitions[panelId].title}
        onClosePanel={toggleWorkspacePanel}
        onMovePanel={moveWorkspacePanel}
        onSelectPanel={(panelId) => {
          setActiveWorkspacePanel(region, panelId);
        }}
      >
        {activePanelId === null ? null : renderWorkspacePanel(activePanelId)}
      </WorkspaceRegion>
    );
  };

  const workspacePrimaryPane =
    bottomPanelIds.length === 0 ? (
      renderWorkspaceRegion("main")
    ) : (
      <SplitLayout
        key={`workspace-rows-${bottomPanelIds.join("-")}`}
        defaultSizes={normalizePaneSizes(workspaceRowSizes)}
        onChange={setWorkspaceRowSizes}
        orientation="vertical"
        panes={[
          {
            content: renderWorkspaceRegion("main"),
            id: "workspace-main-region",
            minSize: 220,
            preferredSize: `${workspaceRowSizes[0]}%`,
          },
          {
            content: renderWorkspaceRegion("bottom"),
            id: "workspace-bottom-region",
            minSize: 180,
            preferredSize: `${workspaceRowSizes[1]}%`,
          },
        ]}
      />
    );

  return (
    <main className={appShell}>
      <header className={headerBar}>
        <h1 className={shellTitle}>Shadily</h1>
        <div className={headerActions}>
          <div className={panelToggleGroup}>
            {(Object.keys(workspacePanelDefinitions) as WorkspacePanelId[]).map(
              (panelId) => {
                const panel = workspacePanels[panelId];

                return (
                  <button
                    key={panelId}
                    className={[
                      panelToggle,
                      panel.isOpen ? panelToggleActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      toggleWorkspacePanel(panelId);
                    }}
                    type="button"
                  >
                    {workspacePanelDefinitions[panelId].title}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </header>
      <section className={layoutViewport}>
        <SplitLayout
          defaultSizes={normalizePaneSizes(shellPaneSizes)}
          onChange={setShellPaneSizes}
          panes={[
            {
              content: <ProjectSidebar />,
              id: "project-sidebar",
              minSize: 220,
              preferredSize: `${shellPaneSizes[0]}%`,
            },
            {
              content: (
                <div className={workspaceShell}>
                  {sidePanelIds.length === 0 ? (
                    workspacePrimaryPane
                  ) : (
                    <SplitLayout
                      key={`workspace-columns-${sidePanelIds.join("-")}`}
                      defaultSizes={normalizePaneSizes(workspaceColumnSizes)}
                      onChange={setWorkspaceColumnSizes}
                      panes={[
                        {
                          content: workspacePrimaryPane,
                          id: "workspace-primary-pane",
                          minSize: 320,
                          preferredSize: `${workspaceColumnSizes[0]}%`,
                        },
                        {
                          content: renderWorkspaceRegion("side"),
                          id: "workspace-side-region",
                          minSize: 280,
                          preferredSize: `${workspaceColumnSizes[1]}%`,
                        },
                      ]}
                    />
                  )}
                </div>
              ),
              id: "workspace-shell",
              minSize: 720,
            },
          ]}
        />
      </section>
      <footer className={footerBar}>
        <div className={shellFrame}>
          Panels can be resized, closed from the header, and moved between main,
          side, and bottom regions.
        </div>
      </footer>
    </main>
  );
};
