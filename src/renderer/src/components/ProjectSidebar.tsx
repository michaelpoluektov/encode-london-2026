import { type JSX, type KeyboardEvent, useEffect, useState } from "react";
import { useProjectStore } from "../store/project-store";
import { Panel } from "./Panel";
import {
  projectList,
  projectSection,
  projectSidebar,
} from "./project-sidebar.css";
import { Button } from "./ui/Button";
import { NavItem } from "./ui/NavItem";
import { Stack } from "./ui/Stack";
import { Text } from "./ui/Text";

export const ProjectSidebar = (): JSX.Element => {
  const project = useProjectStore((s) => s.project);
  const activeFile = useProjectStore((s) => s.activeFile);
  const recentProjects = useProjectStore((s) => s.recentProjects);
  const openProject = useProjectStore((s) => s.openProject);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const setRecentProjects = useProjectStore((s) => s.setRecentProjects);

  const [pendingFolder, setPendingFolder] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState("");

  useEffect(() => {
    window.shadily.project.getRecents().then(setRecentProjects);
  }, [setRecentProjects]);

  const handleNewProject = async (): Promise<void> => {
    const folder = await window.shadily.project.pickFolder();
    if (folder !== null) {
      setPendingFolder(folder);
      setPendingName("my-shader");
    }
  };

  const handleCreateConfirm = async (): Promise<void> => {
    if (pendingFolder === null || pendingName.trim() === "") return;
    const result = await window.shadily.project.create(
      pendingFolder,
      pendingName.trim(),
    );
    setPendingFolder(null);
    setPendingName("");
    if (result !== null) {
      openProject(result);
      const recents = await window.shadily.project.getRecents();
      setRecentProjects(recents);
    }
  };

  const handleCreateKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      void handleCreateConfirm();
    } else if (e.key === "Escape") {
      setPendingFolder(null);
      setPendingName("");
    }
  };

  const handleOpenProject = async (): Promise<void> => {
    const result = await window.shadily.project.open();
    if (result !== null) {
      openProject(result);
      const recents = await window.shadily.project.getRecents();
      setRecentProjects(recents);
    }
  };

  const handleOpenRecent = async (path: string): Promise<void> => {
    const result = await window.shadily.project.openPath(path);
    if (result !== null) {
      openProject(result);
      const recents = await window.shadily.project.getRecents();
      setRecentProjects(recents);
    }
  };

  const actions = (
    <Stack direction="row" gap={2}>
      <Button size="sm" onClick={() => void handleNewProject()}>
        New
      </Button>
      <Button size="sm" onClick={() => void handleOpenProject()}>
        Open
      </Button>
    </Stack>
  );

  return (
    <Panel actions={actions} title="Project">
      <Stack className={projectSidebar} gap={4}>
        {pendingFolder !== null ? (
          <section className={projectSection}>
            <Text as="span" variant="label">
              New project name
            </Text>
            <input
              // biome-ignore lint/a11y/noAutofocus: intentional focus for inline input
              autoFocus
              type="text"
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              style={{
                background: "transparent",
                border: "1px solid currentColor",
                borderRadius: 4,
                color: "inherit",
                font: "inherit",
                outline: "none",
                padding: "4px 8px",
              }}
            />
          </section>
        ) : null}

        {project !== null ? (
          <section className={projectSection}>
            <Text as="span" variant="label">
              {project.manifest.name}
            </Text>
            <div className={projectList}>
              <button
                type="button"
                onClick={() => setActiveFile("fragment")}
                style={{ all: "unset", cursor: "pointer" }}
              >
                <NavItem
                  active={activeFile === "fragment"}
                  subtitle={project.folderPath}
                  title={project.manifest.shaders.fragment}
                />
              </button>
              <button
                type="button"
                onClick={() => setActiveFile("vertex")}
                style={{ all: "unset", cursor: "pointer" }}
              >
                <NavItem
                  active={activeFile === "vertex"}
                  subtitle={project.folderPath}
                  title={project.manifest.shaders.vertex}
                />
              </button>
              <NavItem subtitle={project.folderPath} title="captures/" />
            </div>
          </section>
        ) : (
          <section className={projectSection}>
            <Text as="span" variant="label">
              No project open
            </Text>
            {recentProjects.length > 0 ? (
              <>
                <Text as="span" variant="label">
                  Recent
                </Text>
                <div className={projectList}>
                  {recentProjects.map((recent) => (
                    <button
                      key={recent.path}
                      type="button"
                      onClick={() => void handleOpenRecent(recent.path)}
                      style={{ all: "unset", cursor: "pointer" }}
                    >
                      <NavItem subtitle={recent.path} title={recent.name} />
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        )}
      </Stack>
    </Panel>
  );
};
