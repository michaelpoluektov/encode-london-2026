import { createProjectSavePayload, useProjectStore } from "./project-store";

export const saveCurrentProject = async (): Promise<void> => {
  const project = useProjectStore.getState().project;

  if (project === null) {
    return;
  }

  const savedProject = await window.shadily.project.save(
    createProjectSavePayload(project),
  );
  useProjectStore.getState().commitSavedProject(savedProject);
};
