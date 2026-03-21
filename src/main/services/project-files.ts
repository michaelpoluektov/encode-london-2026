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
  DEFAULT_AGENTS_MD,
  DEFAULT_NODE_GLSL_FILES,
  DEFAULT_PROJECT_FILE_PATHS,
} from "../../shared/default-project";
import {
  buildProjectTree,
  getLanguageForPath,
  getProjectItemKind,
} from "./project-tree";

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

const getEditablePaths = (manifest: ShadilyManifest): Set<string> =>
  new Set([toProjectPath(manifest.graph.source)]);

export const readGraphSource = (
  folderPath: string,
  manifest: ShadilyManifest,
): string =>
  readFileSync(join(folderPath, manifest.graph.source), "utf-8");

export const createProjectOpenResult = (
  folderPath: string,
  manifest: ShadilyManifest,
  graphSource: string,
): ProjectOpenResult => ({
  folderPath,
  manifest,
  graphSource,
  tree: buildProjectTree(folderPath, manifest),
});

export const loadProject = (folderPath: string): ProjectOpenResult => {
  const manifestRaw = JSON.parse(
    readFileSync(
      join(folderPath, DEFAULT_PROJECT_FILE_PATHS.manifest),
      "utf-8",
    ),
  );
  const manifest = shadilyManifestSchema.parse(manifestRaw);
  const graphSource = readGraphSource(folderPath, manifest);

  return createProjectOpenResult(folderPath, manifest, graphSource);
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

  const nodesDir = join(folderPath, DEFAULT_PROJECT_FILE_PATHS.nodesDir);
  mkdirSync(nodesDir, { recursive: true });

  const { manifest, graphSource } = createDefaultProjectContents(name);

  writeFileSync(
    join(folderPath, DEFAULT_PROJECT_FILE_PATHS.manifest),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );
  writeFileSync(
    join(folderPath, manifest.graph.source),
    graphSource,
    "utf-8",
  );
  writeFileSync(
    join(folderPath, DEFAULT_PROJECT_FILE_PATHS.agentInstructions),
    DEFAULT_AGENTS_MD,
    "utf-8",
  );

  for (const [filename, content] of Object.entries(DEFAULT_NODE_GLSL_FILES)) {
    writeFileSync(join(nodesDir, filename), content, "utf-8");
  }

  return createProjectOpenResult(folderPath, manifest, graphSource);
};

export const openProject = async (
  folderPath: string,
): Promise<ProjectOpenResult> => loadProject(folderPath);

export const reloadProject = async (
  folderPath: string,
): Promise<ProjectOpenResult> => loadProject(folderPath);

export const readProjectEntry = ({
  folderPath,
  manifest,
  path,
}: ProjectEntryRequest): ProjectEntryResult => {
  const projectPath = toProjectPath(path);
  const absolutePath = resolveProjectPath(folderPath, projectPath);
  const editablePaths = getEditablePaths(manifest);
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
  graphSource: string,
): Promise<ProjectOpenResult> => {
  const updated: ShadilyManifest = {
    ...manifest,
    modified: new Date().toISOString(),
  };

  writeFileSync(
    join(folderPath, manifest.graph.source),
    graphSource,
    "utf-8",
  );
  writeFileSync(
    join(folderPath, DEFAULT_PROJECT_FILE_PATHS.manifest),
    JSON.stringify(updated, null, 2),
    "utf-8",
  );

  return createProjectOpenResult(folderPath, updated, graphSource);
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
