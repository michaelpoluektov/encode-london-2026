import { type JSX, useEffect, useRef } from "react";
import {
  appShell,
  footerBar,
  headerBar,
  layoutViewport,
  shellFrame,
  shellTitle,
  workspaceColumn,
  workspaceGrid,
  workspaceShell,
} from "./app-shell.css";
import { ChatPanel } from "./components/ChatPanel";
import { GraphPanel } from "./components/GraphPanel";
import { Panel } from "./components/Panel";
import { PreviewViewport } from "./components/PreviewViewport";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { ShaderEditor } from "./components/ShaderEditor";
import { SplitLayout } from "./components/SplitLayout";
import { Button } from "./components/ui/Button";
import { Text } from "./components/ui/Text";
import { useAppStore } from "./store/app-store";
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
  const isProjectSidebarOpen = useAppStore(
    (state) => state.isProjectSidebarOpen,
  );
  const setProjectSidebarOpen = useAppStore(
    (state) => state.setProjectSidebarOpen,
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

  const workspaceGridShell = (
    <div className={workspaceGrid}>
      <SplitLayout
        defaultSizes={normalizePaneSizes(workspaceColumnSizes)}
        onChange={setWorkspaceColumnSizes}
        panes={[
          {
            content: (
              <div className={workspaceColumn}>
                <SplitLayout
                  defaultSizes={normalizePaneSizes(workspaceLeftRowSizes)}
                  onChange={setWorkspaceLeftRowSizes}
                  orientation="vertical"
                  panes={[
                    {
                      content: (
                        <Panel title="Source">
                          <ShaderEditor />
                        </Panel>
                      ),
                      id: "source-panel",
                      minSize: 220,
                      preferredSize: `${workspaceLeftRowSizes[0]}%`,
                    },
                    {
                      content: (
                        <Panel title="Graph">
                          <GraphPanel />
                        </Panel>
                      ),
                      id: "graph-panel",
                      minSize: 180,
                      preferredSize: `${workspaceLeftRowSizes[1]}%`,
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
                <SplitLayout
                  defaultSizes={normalizePaneSizes(workspaceRightRowSizes)}
                  onChange={setWorkspaceRightRowSizes}
                  orientation="vertical"
                  panes={[
                    {
                      content: (
                        <Panel title="Chat">
                          <ChatPanel />
                        </Panel>
                      ),
                      id: "chat-panel",
                      minSize: 220,
                      preferredSize: `${workspaceRightRowSizes[0]}%`,
                    },
                    {
                      content: (
                        <Panel title="Render">
                          <PreviewViewport />
                        </Panel>
                      ),
                      id: "render-panel",
                      minSize: 220,
                      preferredSize: `${workspaceRightRowSizes[1]}%`,
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
      <header className={headerBar}>
        <Text as="h1" className={shellTitle} variant="title">
          Shadily
        </Text>
        <Button
          onClick={() => {
            setProjectSidebarOpen(!isProjectSidebarOpen);
          }}
          variant="outline"
        >
          {isProjectSidebarOpen ? "Hide Project" : "Show Project"}
        </Button>
      </header>
      <section className={layoutViewport}>
        {isProjectSidebarOpen ? (
          <SplitLayout
            defaultSizes={normalizePaneSizes(shellPaneSizes)}
            onChange={setShellPaneSizes}
            panes={[
              {
                content: <ProjectSidebar />,
                id: "project-sidebar",
                minSize: 220,
                preferredSize: `${shellPaneSizes[0]}%`,
                snap: true,
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
        ) : (
          <div className={workspaceShell}>{workspaceGridShell}</div>
        )}
      </section>
      <footer className={footerBar}>
        <div className={shellFrame}>
          <Text as="span" tone="muted" variant="caption">
            Resizable 2x2 workspace with a collapsible project sidebar.
          </Text>
        </div>
      </footer>
    </main>
  );
};
