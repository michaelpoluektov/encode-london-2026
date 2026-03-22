import type {
  ProjectEntryRequest,
  ProjectEntryResult,
  ProjectLayoutState,
  ProjectOpenResult,
  ProjectSaveCapturePayload,
  ProjectSaveCaptureResult,
  ShadilyManifest,
} from "../../shared/contracts";
import {
  createProject as createProjectFiles,
  loadProject,
  openProject as openProjectFiles,
  readProjectEntry as readProjectEntryFile,
  reloadProject as reloadProjectFiles,
  saveCapture as saveCaptureFile,
  saveProject as saveProjectFiles,
} from "./project-files";
import {
  deleteProjectMetadata,
  deleteProjectMetadataByPath,
  getProjectLayout,
  hasProjectFolder,
  listRecentProjectMetadata,
  saveProjectLayout,
  upsertOpenProjectMetadata,
  upsertProjectMetadata,
} from "./project-metadata";

export const createProject = async (
  parentDir: string,
  name: string,
): Promise<ProjectOpenResult> => {
  const project = await createProjectFiles(parentDir, name);
  await upsertOpenProjectMetadata(project);
  return project;
};

export const openProject = async (
  folderPath: string,
): Promise<ProjectOpenResult> => {
  const project = await openProjectFiles(folderPath);
  await upsertOpenProjectMetadata(project);
  return project;
};

export const reloadProject = async (
  folderPath: string,
): Promise<ProjectOpenResult> => reloadProjectFiles(folderPath);

export const readProjectEntry = (
  payload: ProjectEntryRequest,
): ProjectEntryResult => readProjectEntryFile(payload);

export const saveCapture = async (
  payload: ProjectSaveCapturePayload,
): Promise<ProjectSaveCaptureResult> => saveCaptureFile(payload);

export const saveProject = async (
  folderPath: string,
  manifest: ShadilyManifest,
  textEntries: Record<string, string>,
): Promise<ProjectOpenResult> => {
  const project = await saveProjectFiles(folderPath, manifest, textEntries);
  await upsertProjectMetadata(project.folderPath, project.manifest);
  return project;
};

export const readProjectLayout = (
  projectId: string,
): Promise<ProjectLayoutState | null> => getProjectLayout(projectId);

export const writeProjectLayout = (
  projectId: string,
  layout: ProjectLayoutState,
): Promise<void> => saveProjectLayout(projectId, layout);

export const openMostRecentProject =
  async (): Promise<ProjectOpenResult | null> => {
    for (const metadata of await listRecentProjectMetadata()) {
      if (!hasProjectFolder(metadata.folder_path)) {
        await deleteProjectMetadata(metadata.project_id);
        continue;
      }

      try {
        const project = loadProject(metadata.folder_path);
        await upsertOpenProjectMetadata(project);
        return project;
      } catch {
        await deleteProjectMetadataByPath(metadata.folder_path);
      }
    }

    return null;
  };
