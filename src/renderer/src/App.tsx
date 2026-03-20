import { type JSX, lazy, Suspense, useEffect } from "react";
import {
  appShell,
  badgeRow,
  heroCopy,
  heroPanelBody,
  heroPanelHeading,
  heroTitle,
  splitPanelBody,
  workspaceSection,
} from "./app-shell.css";
import { Panel } from "./components/Panel";
import { SplitLayout } from "./components/SplitLayout";
import { StatusBadge } from "./components/StatusBadge";
import { useAppStore } from "./store/app-store";

const ShaderEditor = lazy(async () => ({
  default: (await import("./components/ShaderEditor")).ShaderEditor,
}));

const PreviewViewport = lazy(async () => ({
  default: (await import("./components/PreviewViewport")).PreviewViewport,
}));

type PanelPlaceholderProps = {
  readonly eyebrow: string;
  readonly title: string;
};

const PanelPlaceholder = ({
  eyebrow,
  title,
}: PanelPlaceholderProps): JSX.Element => (
  <Panel
    eyebrow={eyebrow}
    title={title}
    tone="muted"
    bodyClassName={splitPanelBody}
  >
    <div />
  </Panel>
);

export const App = (): JSX.Element => {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const setBootstrap = useAppStore((state) => state.setBootstrap);
  const workspacePaneSizes = useAppStore((state) => state.workspacePaneSizes);
  const setWorkspacePaneSizes = useAppStore(
    (state) => state.setWorkspacePaneSizes,
  );

  useEffect(() => {
    void window.shadily.getBootstrapPayload().then(setBootstrap);
  }, [setBootstrap]);

  return (
    <main className={appShell}>
      <Panel eyebrow="Hackathon V1 Scaffold" tone="muted">
        <div className={heroPanelBody}>
          <div className={heroPanelHeading}>
            <h1 className={heroTitle}>Shadily</h1>
            <p className={heroCopy}>
              Electron shell, Monaco editor, Three.js preview, Bun toolchain,
              and a ready Codex runtime boundary.
            </p>
          </div>
          <div className={badgeRow}>
            <StatusBadge
              label="Platform"
              value={bootstrap?.platform ?? "loading"}
            />
            <StatusBadge
              label="Codex SDK"
              value={bootstrap?.codex.available ? "wired" : "unavailable"}
              tone={bootstrap?.codex.available ? "success" : "warning"}
            />
            <StatusBadge
              label="Mode"
              value={bootstrap?.codex.mode ?? "pending"}
              tone="accent"
            />
          </div>
        </div>
      </Panel>
      <section className={workspaceSection}>
        <Panel
          eyebrow="Workspace Layout"
          title="Editor and preview"
          bodyClassName={splitPanelBody}
        >
          <SplitLayout
            defaultSizes={workspacePaneSizes}
            onChange={setWorkspacePaneSizes}
            panes={[
              {
                id: "shader-editor",
                content: (
                  <Suspense
                    fallback={
                      <PanelPlaceholder
                        eyebrow="Shader Source"
                        title="Fragment shader"
                      />
                    }
                  >
                    <ShaderEditor />
                  </Suspense>
                ),
                minSize: 420,
                preferredSize: "58%",
              },
              {
                id: "preview-viewport",
                content: (
                  <Suspense
                    fallback={
                      <PanelPlaceholder
                        eyebrow="Live Preview"
                        title="Three.js viewport"
                      />
                    }
                  >
                    <PreviewViewport />
                  </Suspense>
                ),
                minSize: 360,
                preferredSize: "42%",
              },
            ]}
          />
        </Panel>
      </section>
    </main>
  );
};
