import type { ProjectOpenResult, RecentProject } from "../../shared/contracts";
import {
  createProject,
  loadProject,
  openProject,
  readProjectEntry,
  reloadProject,
  saveCapture,
  saveProject,
} from "./project-files";
import {
  addRecentProject,
  getAppConfig,
  replaceRecentProjects,
} from "./recent-projects";

export {
  createProject,
  openProject,
  readProjectEntry,
  reloadProject,
  saveCapture,
  saveProject,
};

export const openMostRecentProject =
  async (): Promise<ProjectOpenResult | null> => {
    const config = getAppConfig();
    const validRecents: RecentProject[] = [];
    let initialProject: ProjectOpenResult | null = null;

    for (const recentProject of config.recentProjects) {
      try {
        const project = loadProject(recentProject.path, false);
        validRecents.push({
          name: project.manifest.name,
          path: recentProject.path,
        });
        initialProject ??= project;
      } catch {
        // Drop stale or invalid recents while scanning the list.
      }
    }

    if (validRecents.length !== config.recentProjects.length) {
      replaceRecentProjects(validRecents);
    }

    if (initialProject === null) {
      return null;
    }

    addRecentProject({
      name: initialProject.manifest.name,
      path: initialProject.folderPath,
    });

    return initialProject;
  };
