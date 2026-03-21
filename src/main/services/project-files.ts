import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  type ProjectEntryRequest,
  type ProjectEntryResult,
  type ProjectOpenResult,
  type ProjectSaveCapturePayload,
  type ProjectSaveCaptureResult,
  type ShadilyManifest,
  shadilyManifestSchema,
} from "../../shared/contracts";
import {
  createDefaultProjectContents,
  DEFAULT_PROJECT_FILE_PATHS,
} from "../../shared/default-project";
import {
  buildProjectTree,
  getLanguageForPath,
  getProjectItemKind,
} from "./project-tree";
import { addRecentProject } from "./recent-projects";

const toProjectPath = (path: string): string => path.split(sep).join("/");

const resolveProjectPath = (folderPath: string, path: string): string => {
  const projectRoot = resolve(folderPath);
  const resolvedPath = resolve(projectRoot, path);

  if (
    resolvedPath !== projectRoot &&
    !resolvedPath.startsWith(`${projectRoot}${sep}`)
  ) {
    throw new Error("Project path escaped the project root.");
  }

  return resolvedPath;
};

const getEditableShaderPaths = (manifest: ShadilyManifest): Set<string> =>
  new Set([
    toProjectPath(manifest.shaders.fragment),
    toProjectPath(manifest.shaders.vertex),
  ]);

export const readShaders = (
  folderPath: string,
  manifest: ShadilyManifest,
): { fragment: string; vertex: string } => {
  const fragment = readFileSync(
    join(folderPath, manifest.shaders.fragment),
    "utf-8",
  );
  const vertex = readFileSync(
    join(folderPath, manifest.shaders.vertex),
    "utf-8",
  );

  return { fragment, vertex };
};

export const createProjectOpenResult = (
  folderPath: string,
  manifest: ShadilyManifest,
  shaders: { fragment: string; vertex: string },
): ProjectOpenResult => ({
  folderPath,
  manifest,
  shaders,
  tree: buildProjectTree(folderPath, manifest),
});

export const loadProject = (
  folderPath: string,
  recordRecent = true,
): ProjectOpenResult => {
  const manifestRaw = JSON.parse(
    readFileSync(
      join(folderPath, DEFAULT_PROJECT_FILE_PATHS.manifest),
      "utf-8",
    ),
  );
  const manifest = shadilyManifestSchema.parse(manifestRaw);
  const shaders = readShaders(folderPath, manifest);

  if (recordRecent) {
    addRecentProject({ name: manifest.name, path: folderPath });
  }

  return createProjectOpenResult(folderPath, manifest, shaders);
};

export const createProject = async (
  parentDir: string,
  name: string,
): Promise<ProjectOpenResult> => {
  const folderPath = join(parentDir, name);
  mkdirSync(folderPath, { recursive: true });
  mkdirSync(join(folderPath, DEFAULT_PROJECT_FILE_PATHS.capturesDir), {
    recursive: true,
  });

  const { manifest, shaders } = createDefaultProjectContents(name);

  writeFileSync(
    join(folderPath, DEFAULT_PROJECT_FILE_PATHS.manifest),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );
  writeFileSync(
    join(folderPath, manifest.shaders.fragment),
    shaders.fragment,
    "utf-8",
  );
  writeFileSync(
    join(folderPath, manifest.shaders.vertex),
    shaders.vertex,
    "utf-8",
  );

  addRecentProject({ name, path: folderPath });

  return createProjectOpenResult(folderPath, manifest, shaders);
};

export const openProject = async (
  folderPath: string,
): Promise<ProjectOpenResult> => loadProject(folderPath);

export const reloadProject = async (
  folderPath: string,
): Promise<ProjectOpenResult> => loadProject(folderPath, false);

export const readProjectEntry = ({
  folderPath,
  manifest,
  path,
}: ProjectEntryRequest): ProjectEntryResult => {
  const projectPath = toProjectPath(path);
  const absolutePath = resolveProjectPath(folderPath, projectPath);
  const editablePaths = getEditableShaderPaths(manifest);
  const itemKind = getProjectItemKind(absolutePath, projectPath, editablePaths);

  if (!existsSync(absolutePath)) {
    throw new Error("Project entry does not exist.");
  }

  if (itemKind === "image") {
    return {
      path: projectPath,
      kind: "image",
      isEditable: false,
      sourceUrl: pathToFileURL(absolutePath).toString(),
    };
  }

  if (itemKind === "binary") {
    return {
      path: projectPath,
      kind: "binary",
      language: null,
      isEditable: false,
    };
  }

  return {
    path: projectPath,
    kind: "text",
    language: getLanguageForPath(projectPath),
    isEditable: itemKind === "editable",
    content: readFileSync(absolutePath, "utf-8"),
  };
};

export const saveProject = async (
  folderPath: string,
  manifest: ShadilyManifest,
  shaders: { fragment: string; vertex: string },
): Promise<ProjectOpenResult> => {
  const updated: ShadilyManifest = {
    ...manifest,
    modified: new Date().toISOString(),
  };

  writeFileSync(
    join(folderPath, manifest.shaders.fragment),
    shaders.fragment,
    "utf-8",
  );
  writeFileSync(
    join(folderPath, manifest.shaders.vertex),
    shaders.vertex,
    "utf-8",
  );
  writeFileSync(
    join(folderPath, DEFAULT_PROJECT_FILE_PATHS.manifest),
    JSON.stringify(updated, null, 2),
    "utf-8",
  );

  return createProjectOpenResult(folderPath, updated, shaders);
};

export const saveCapture = async ({
  folderPath,
  dataUrl,
}: ProjectSaveCapturePayload): Promise<ProjectSaveCaptureResult> => {
  const capturesDir = join(folderPath, DEFAULT_PROJECT_FILE_PATHS.capturesDir);
  mkdirSync(capturesDir, { recursive: true });

  const base64Payload = dataUrl.replace(/^data:image\/png;base64,/, "");
  const imageBuffer = Buffer.from(base64Payload, "base64");
  const imageName =
    `capture-${new Date().toISOString().replaceAll(":", "-")}-` +
    `${Math.random().toString(36).slice(2, 8)}.png`;
  const imagePath = join(capturesDir, imageName);

  writeFileSync(imagePath, imageBuffer);

  return { imagePath };
};
