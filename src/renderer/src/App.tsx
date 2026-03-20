import { type JSX, lazy, Suspense, useEffect } from "react";
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
  <section className="panel panel-placeholder">
    <div className="panel-header">
      <div>
        <p className="panel-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
    </div>
    <div className="panel-skeleton" />
  </section>
);

export const App = (): JSX.Element => {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const setBootstrap = useAppStore((state) => state.setBootstrap);

  useEffect(() => {
    void window.shadily.getBootstrapPayload().then(setBootstrap);
  }, [setBootstrap]);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Hackathon V1 Scaffold</p>
          <h1>Shadily</h1>
          <p className="hero-copy">
            Electron shell, Monaco editor, Three.js preview, Bun toolchain, and
            a ready Codex runtime boundary.
          </p>
        </div>
        <div className="status-row">
          <div className="status-card">
            <span className="status-label">Platform</span>
            <strong>{bootstrap?.platform ?? "loading"}</strong>
          </div>
          <div className="status-card">
            <span className="status-label">Codex SDK</span>
            <strong>
              {bootstrap?.codex.available ? "wired" : "unavailable"}
            </strong>
          </div>
          <div className="status-card">
            <span className="status-label">Mode</span>
            <strong>{bootstrap?.codex.mode ?? "pending"}</strong>
          </div>
        </div>
      </section>
      <section className="workspace-grid">
        <Suspense
          fallback={
            <PanelPlaceholder eyebrow="Shader Source" title="Fragment shader" />
          }
        >
          <ShaderEditor />
        </Suspense>
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
      </section>
    </main>
  );
};
