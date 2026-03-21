import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { app } from "electron";
import {
  type AppConfig,
  appConfigSchema,
  type ProjectEntryRequest,
  type ProjectEntryResult,
  type ProjectOpenResult,
  type ProjectSaveCapturePayload,
  type ProjectSaveCaptureResult,
  type ProjectTreeNode,
  type RecentProject,
  type ShadilyManifest,
  shadilyManifestSchema,
} from "../../shared/contracts";

const DEFAULT_FRAGMENT_SHADER = `uniform float u_time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(color, 1.0);
}`;

const DEFAULT_VERTEX_SHADER = `varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const getConfigPath = (): string =>
  join(app.getPath("userData"), "config.json");

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

const isTextFile = (filePath: string): boolean => {
  try {
    const sample = readFileSync(filePath).subarray(0, 1024);
    return !sample.includes(0);
  } catch {
    return false;
  }
};

const getLanguageForPath = (projectPath: string): string => {
  switch (extname(projectPath).toLowerCase()) {
    case ".frag":
    case ".vert":
    case ".glsl":
    case ".vs":
    case ".fs":
      return "glsl";
    case ".json":
      return "json";
    case ".md":
      return "markdown";
    case ".css":
      return "css";
    case ".html":
      return "html";
    case ".js":
      return "javascript";
    case ".jsx":
      return "javascript";
    case ".ts":
      return "typescript";
    case ".tsx":
      return "typescript";
    case ".yml":
    case ".yaml":
      return "yaml";
    default:
      return "plaintext";
  }
};

const getProjectItemKind = (
  absolutePath: string,
  projectPath: string,
  editablePaths: ReadonlySet<string>,
): ProjectTreeNode["itemKind"] => {
  if (editablePaths.has(projectPath) && isTextFile(absolutePath)) {
    return "editable";
  }

  if (IMAGE_EXTENSIONS.has(extname(projectPath).toLowerCase())) {
    return "image";
  }

  if (isTextFile(absolutePath)) {
    return "readOnly";
  }

  return "binary";
};

const sortTreeNodes = (nodes: ProjectTreeNode[]): ProjectTreeNode[] =>
  [...nodes].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "directory" ? -1 : 1;
    }

    return left.name.localeCompare(right.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const buildProjectTree = (
  folderPath: string,
  manifest: ShadilyManifest,
): ProjectTreeNode[] => {
  const editablePaths = getEditableShaderPaths(manifest);

  const walkDirectory = (
    absoluteDir: string,
    relativeDir = "",
  ): ProjectTreeNode[] =>
    sortTreeNodes(
      readdirSync(absoluteDir, { withFileTypes: true }).map((entry) => {
        const relativePath =
          relativeDir === "" ? entry.name : `${relativeDir}/${entry.name}`;
        const absolutePath = join(absoluteDir, entry.name);

        if (entry.isDirectory()) {
          return {
            path: relativePath,
            name: entry.name,
            kind: "directory",
            itemKind: "directory",
            children: walkDirectory(absolutePath, relativePath),
          } satisfies ProjectTreeNode;
        }

        return {
          path: relativePath,
          name: entry.name,
          kind: "file",
          itemKind: getProjectItemKind(
            absolutePath,
            relativePath,
            editablePaths,
          ),
        } satisfies ProjectTreeNode;
      }),
    );

  return walkDirectory(folderPath);
};

const createProjectOpenResult = (
  folderPath: string,
  manifest: ShadilyManifest,
  shaders: { fragment: string; vertex: string },
): ProjectOpenResult => ({
  folderPath,
  manifest,
  shaders,
  tree: buildProjectTree(folderPath, manifest),
});

const loadProject = (
  folderPath: string,
  recordRecent = true,
): ProjectOpenResult => {
  const manifestRaw = JSON.parse(
    readFileSync(join(folderPath, "shadily.json"), "utf-8"),
  );
  const manifest = shadilyManifestSchema.parse(manifestRaw);
  const shaders = readShaders(folderPath, manifest);

  if (recordRecent) {
    addRecentProject({ name: manifest.name, path: folderPath });
  }

  return createProjectOpenResult(folderPath, manifest, shaders);
};

export const getAppConfig = (): AppConfig => {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    return { recentProjects: [] };
  }
  try {
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));
    return appConfigSchema.parse(raw);
  } catch {
    return { recentProjects: [] };
  }
};

const saveAppConfig = (config: AppConfig): void => {
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
};

export const addRecentProject = (entry: RecentProject): void => {
  const config = getAppConfig();
  const filtered = config.recentProjects.filter((p) => p.path !== entry.path);
  const recentProjects = [entry, ...filtered].slice(0, 10);
  saveAppConfig({ ...config, recentProjects });
};

export const openMostRecentProject =
  async (): Promise<ProjectOpenResult | null> => {
    const config = getAppConfig();
    const validRecents: RecentProject[] = [];
    let initialProject: ProjectOpenResult | null = null;

    for (const recentProject of config.recentProjects) {
      try {
        const project = loadProject(recentProject.path, false);
        const entry = {
          name: project.manifest.name,
          path: recentProject.path,
        } satisfies RecentProject;
        validRecents.push(entry);
        initialProject ??= project;
      } catch {
        // Drop stale or invalid recents while scanning the list.
      }
    }

    if (validRecents.length !== config.recentProjects.length) {
      saveAppConfig({ ...config, recentProjects: validRecents });
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

export const createProject = async (
  parentDir: string,
  name: string,
): Promise<ProjectOpenResult> => {
  const folderPath = join(parentDir, name);
  mkdirSync(folderPath, { recursive: true });
  mkdirSync(join(folderPath, "captures"), { recursive: true });

  const now = new Date().toISOString();
  const manifest: ShadilyManifest = {
    name,
    version: "1",
    shaders: { fragment: "material.frag", vertex: "material.vert" },
    preview: { mesh: "torusKnot" },
    created: now,
    modified: now,
  };

  writeFileSync(
    join(folderPath, "shadily.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );
  writeFileSync(
    join(folderPath, "material.frag"),
    DEFAULT_FRAGMENT_SHADER,
    "utf-8",
  );
  writeFileSync(
    join(folderPath, "material.vert"),
    DEFAULT_VERTEX_SHADER,
    "utf-8",
  );

  addRecentProject({ name, path: folderPath });

  return createProjectOpenResult(folderPath, manifest, {
    fragment: DEFAULT_FRAGMENT_SHADER,
    vertex: DEFAULT_VERTEX_SHADER,
  });
};

export const openProject = async (
  folderPath: string,
): Promise<ProjectOpenResult> => loadProject(folderPath);

export const reloadProject = async (
  folderPath: string,
): Promise<ProjectOpenResult> => loadProject(folderPath, false);

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
): Promise<void> => {
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
    join(folderPath, "shadily.json"),
    JSON.stringify(updated, null, 2),
    "utf-8",
  );
};

export const saveCapture = async ({
  folderPath,
  dataUrl,
}: ProjectSaveCapturePayload): Promise<ProjectSaveCaptureResult> => {
  const capturesDir = join(folderPath, "captures");
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
