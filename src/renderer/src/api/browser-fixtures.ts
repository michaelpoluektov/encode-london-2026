import lavaGraphDefinition from "../../../project-template/docs/examples/lava-shader/graph.json";
import lavaFieldsSource from "../../../project-template/docs/examples/lava-shader/nodes/lavaFields.glsl?raw";
import lavaFinishSource from "../../../project-template/docs/examples/lava-shader/nodes/lavaFinish.glsl?raw";
import lavaPaletteSource from "../../../project-template/docs/examples/lava-shader/nodes/lavaPalette.glsl?raw";
import lavaWarpSource from "../../../project-template/docs/examples/lava-shader/nodes/lavaWarp.glsl?raw";
import lavaVertexSource from "../../../project-template/docs/examples/lava-shader/vertex.vert?raw";
import type {
  ProjectEntryResult,
  ProjectOpenResult,
  ProjectTreeNode,
  ShadilyManifest,
} from "../../../shared/contracts";
import {
  createDefaultProjectContents,
  DEFAULT_NODE_GLSL_FILES,
  DEFAULT_PROJECT_FILE_PATHS,
  DEFAULT_VERTEX_SHADER,
} from "../../../shared/default-project";

type BrowserTextFile = {
  readonly kind: "text";
  readonly content: string;
  readonly isEditable: boolean;
  readonly language: string;
};

type BrowserImageFile = {
  readonly kind: "image";
  readonly sourceUrl: string;
};

export type BrowserProjectFile = BrowserTextFile | BrowserImageFile;

export type BrowserFixtureKey = "default" | "lava";

export type BrowserProjectRecord = {
  readonly fixtureKey: BrowserFixtureKey;
  readonly files: Readonly<Record<string, BrowserProjectFile>>;
  readonly folderPath: string;
  readonly manifest: ShadilyManifest;
};

type TreeDirectory = {
  readonly children: Map<string, TreeDirectory | ProjectTreeNode>;
  readonly name: string;
  readonly nodeKind: "directory";
  readonly path: string;
};

const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

const normalizeText = (text: string): string =>
  text.replaceAll("\r\n", "\n").trimEnd();

export const normalizeFixturePath = (path: string): string =>
  path
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "");

const createTextFile = (
  content: string,
  language: string,
  isEditable = true,
): BrowserTextFile => ({
  kind: "text",
  content: normalizeText(content),
  isEditable,
  language,
});

const getExtension = (projectPath: string): string => {
  const basename = projectPath.split("/").at(-1) ?? projectPath;
  const extensionIndex = basename.lastIndexOf(".");

  return extensionIndex < 0 ? "" : basename.slice(extensionIndex).toLowerCase();
};

const compareTreeNodes = (
  left: ProjectTreeNode,
  right: ProjectTreeNode,
): number => {
  if (left.kind !== right.kind) {
    return left.kind === "directory" ? -1 : 1;
  }

  return left.name.localeCompare(right.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const insertTreeFile = (
  rootDirectory: TreeDirectory,
  path: string,
  file: BrowserProjectFile,
): void => {
  const segments = path.split("/");
  let currentDirectory = rootDirectory;

  for (const [index, segment] of segments.entries()) {
    const isLeaf = index === segments.length - 1;
    const relativePath = segments.slice(0, index + 1).join("/");

    if (isLeaf) {
      currentDirectory.children.set(segment, {
        path: relativePath,
        name: segment,
        kind: "file",
        itemKind:
          file.kind === "image" || IMAGE_EXTENSIONS.has(getExtension(path))
            ? "image"
            : file.isEditable
              ? "editable"
              : "readOnly",
      });
      return;
    }

    const existingNode = currentDirectory.children.get(segment);

    if (existingNode !== undefined && "nodeKind" in existingNode) {
      currentDirectory = existingNode;
      continue;
    }

    const nextDirectory: TreeDirectory = {
      children: new Map(),
      name: segment,
      nodeKind: "directory",
      path: relativePath,
    };
    currentDirectory.children.set(segment, nextDirectory);
    currentDirectory = nextDirectory;
  }
};

const finalizeTreeDirectory = (
  directory: TreeDirectory,
): readonly ProjectTreeNode[] =>
  [...directory.children.values()]
    .map((node) =>
      "nodeKind" in node
        ? {
            path: node.path,
            name: node.name,
            kind: "directory" as const,
            itemKind: "directory" as const,
            children: [...finalizeTreeDirectory(node)],
          }
        : node,
    )
    .sort(compareTreeNodes);

const buildProjectTree = (
  files: Readonly<Record<string, BrowserProjectFile>>,
): readonly ProjectTreeNode[] => {
  const rootDirectory: TreeDirectory = {
    children: new Map(),
    name: "",
    nodeKind: "directory",
    path: "",
  };

  for (const [rawPath, file] of Object.entries(files)) {
    const path = normalizeFixturePath(rawPath);

    if (path.length === 0) {
      continue;
    }

    insertTreeFile(rootDirectory, path, file);
  }

  return finalizeTreeDirectory(rootDirectory);
};

export const toProjectEntryResult = (
  record: BrowserProjectRecord,
  rawPath: string,
): ProjectEntryResult => {
  const normalizedPath = normalizeFixturePath(rawPath);
  const file = record.files[normalizedPath];

  if (file === undefined) {
    throw new Error(`Fixture project file [${normalizedPath}] was not found.`);
  }

  if (file.kind === "image") {
    return {
      path: normalizedPath,
      kind: "image",
      isEditable: false,
      sourceUrl: file.sourceUrl,
    };
  }

  return {
    path: normalizedPath,
    kind: "text",
    language: file.language,
    isEditable: file.isEditable,
    content: file.content,
  };
};

export const toProjectOpenResult = (
  record: BrowserProjectRecord,
): ProjectOpenResult => {
  const graphPath = normalizeFixturePath(record.manifest.graph.source);
  const graphFile = record.files[graphPath];
  const vertexFile = record.files[DEFAULT_PROJECT_FILE_PATHS.vertex];

  if (graphFile?.kind !== "text") {
    throw new Error(`Fixture project is missing text file [${graphPath}].`);
  }

  if (vertexFile?.kind !== "text") {
    throw new Error("Fixture project is missing vertex.vert.");
  }

  return {
    folderPath: record.folderPath,
    manifest: record.manifest,
    graphSource: graphFile.content,
    vertexSource: vertexFile.content,
    tree: [...buildProjectTree(record.files)],
  };
};

const createDefaultFixtureProject = (): BrowserProjectRecord => {
  const timestamp = "2026-03-23T12:00:00.000Z";
  const contents = createDefaultProjectContents("Browser Default", timestamp);
  const manifest: ShadilyManifest = {
    ...contents.manifest,
    projectId: "7fb4d14c-e0b6-45fe-9700-a14b062b43eb",
  };

  return {
    fixtureKey: "default",
    folderPath: "/browser/default-project",
    manifest,
    files: {
      [DEFAULT_PROJECT_FILE_PATHS.graph]: createTextFile(
        contents.graphSource,
        "json",
      ),
      [DEFAULT_PROJECT_FILE_PATHS.manifest]: createTextFile(
        JSON.stringify(manifest, null, 2),
        "json",
      ),
      [DEFAULT_PROJECT_FILE_PATHS.vertex]: createTextFile(
        DEFAULT_VERTEX_SHADER,
        "glsl",
      ),
      "nodes/pulse.glsl": createTextFile(
        DEFAULT_NODE_GLSL_FILES["pulse.glsl"] ?? "",
        "glsl",
      ),
    },
  };
};

const createLavaFixtureProject = (): BrowserProjectRecord => {
  const timestamp = "2026-03-23T12:00:00.000Z";
  const manifest: ShadilyManifest = {
    projectId: "0efbc195-dbdb-4435-8cc8-a11f90c3eb47",
    name: "Browser Lava",
    version: "2",
    graph: { source: DEFAULT_PROJECT_FILE_PATHS.graph },
    preview: { mesh: "sphere" },
    created: timestamp,
    modified: timestamp,
  };

  return {
    fixtureKey: "lava",
    folderPath: "/browser/lava-project",
    manifest,
    files: {
      [DEFAULT_PROJECT_FILE_PATHS.graph]: createTextFile(
        JSON.stringify(lavaGraphDefinition, null, 2),
        "json",
      ),
      [DEFAULT_PROJECT_FILE_PATHS.manifest]: createTextFile(
        JSON.stringify(manifest, null, 2),
        "json",
      ),
      [DEFAULT_PROJECT_FILE_PATHS.vertex]: createTextFile(
        lavaVertexSource,
        "glsl",
      ),
      "nodes/lavaFields.glsl": createTextFile(lavaFieldsSource, "glsl"),
      "nodes/lavaFinish.glsl": createTextFile(lavaFinishSource, "glsl"),
      "nodes/lavaPalette.glsl": createTextFile(lavaPaletteSource, "glsl"),
      "nodes/lavaWarp.glsl": createTextFile(lavaWarpSource, "glsl"),
    },
  };
};

export const resolveBrowserFixture = (search: string): BrowserFixtureKey => {
  const params = new URLSearchParams(search);
  return params.get("fixture") === "default" ? "default" : "lava";
};

export const createFixtureProject = (
  fixtureKey: BrowserFixtureKey,
): BrowserProjectRecord =>
  fixtureKey === "default"
    ? createDefaultFixtureProject()
    : createLavaFixtureProject();

export const cloneProjectRecord = (
  record: BrowserProjectRecord,
): BrowserProjectRecord => ({
  fixtureKey: record.fixtureKey,
  folderPath: record.folderPath,
  manifest: structuredClone(record.manifest),
  files: Object.fromEntries(
    Object.entries(record.files).map(([path, file]) => [
      path,
      structuredClone(file),
    ]),
  ),
});

export const createBrowserProject = (
  name: string,
  folderPath: string,
): BrowserProjectRecord => {
  const timestamp = new Date().toISOString();
  const contents = createDefaultProjectContents(name, timestamp);

  return {
    fixtureKey: "default",
    folderPath: `${folderPath.replace(/\/+$/, "")}/${name}`,
    manifest: contents.manifest,
    files: {
      [DEFAULT_PROJECT_FILE_PATHS.graph]: createTextFile(
        contents.graphSource,
        "json",
      ),
      [DEFAULT_PROJECT_FILE_PATHS.manifest]: createTextFile(
        JSON.stringify(contents.manifest, null, 2),
        "json",
      ),
      [DEFAULT_PROJECT_FILE_PATHS.vertex]: createTextFile(
        DEFAULT_VERTEX_SHADER,
        "glsl",
      ),
      "nodes/pulse.glsl": createTextFile(
        DEFAULT_NODE_GLSL_FILES["pulse.glsl"] ?? "",
        "glsl",
      ),
    },
  };
};
