import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
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
  DEFAULT_VERTEX_SHADER,
} from "../../shared/default-project";
import {
  buildProjectTree,
  getLanguageForPath,
  getProjectItemKind,
} from "./project-tree";

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

const getDefaultProjectTemplatePath = (): string => {
  const candidates = [
    join(__dirname, "../../project-template"),
    join(process.cwd(), "out/project-template"),
    join(process.cwd(), "src/project-template"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Default project template folder was not found.");
};

export const readGraphSource = (
  folderPath: string,
  manifest: ShadilyManifest,
): string => readFileSync(join(folderPath, manifest.graph.source), "utf-8");

const readVertexSource = (folderPath: string): string => {
  const vertexPath = join(folderPath, DEFAULT_PROJECT_FILE_PATHS.vertex);
  try {
    return readFileSync(vertexPath, "utf-8");
  } catch {
    return DEFAULT_VERTEX_SHADER;
  }
};

export const createProjectOpenResult = (
  folderPath: string,
  manifest: ShadilyManifest,
  graphSource: string,
): ProjectOpenResult => ({
  folderPath,
  manifest,
  graphSource,
  vertexSource: readVertexSource(folderPath),
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
  const templatePath = getDefaultProjectTemplatePath();
  const { manifest } = createDefaultProjectContents(name);

  mkdirSync(folderPath, { recursive: true });
  cpSync(templatePath, folderPath, { recursive: true, force: true });
  mkdirSync(join(folderPath, DEFAULT_PROJECT_FILE_PATHS.capturesDir), {
    recursive: true,
  });

  writeFileSync(
    join(folderPath, DEFAULT_PROJECT_FILE_PATHS.manifest),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );
  const graphSource = readGraphSource(folderPath, manifest);

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
  path,
}: ProjectEntryRequest): ProjectEntryResult => {
  const projectPath = path.split(sep).join("/");
  const absolutePath = resolveProjectPath(folderPath, projectPath);
  const itemKind = getProjectItemKind(absolutePath, projectPath);

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
  textEntries: Record<string, string>,
): Promise<ProjectOpenResult> => {
  const updated: ShadilyManifest = {
    ...manifest,
    modified: new Date().toISOString(),
  };

  for (const [path, content] of Object.entries(textEntries)) {
    const absolutePath = resolveProjectPath(folderPath, path);
    writeFileSync(absolutePath, content, "utf-8");
  }

  writeFileSync(
    join(folderPath, DEFAULT_PROJECT_FILE_PATHS.manifest),
    JSON.stringify(updated, null, 2),
    "utf-8",
  );

  return createProjectOpenResult(
    folderPath,
    updated,
    readGraphSource(folderPath, updated),
  );
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
