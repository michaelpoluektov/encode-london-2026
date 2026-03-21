import { readdirSync, readFileSync } from "node:fs";
import { extname, join, sep } from "node:path";
import type { ProjectTreeNode, ShadilyManifest } from "../../shared/contracts";
import { DEFAULT_PROJECT_FILE_PATHS } from "../../shared/default-project";

const toProjectPath = (path: string): string => path.split(sep).join("/");

const getEditablePaths = (manifest: ShadilyManifest): Set<string> =>
  new Set([
    toProjectPath(manifest.graph.source),
    DEFAULT_PROJECT_FILE_PATHS.vertex,
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

export const getLanguageForPath = (projectPath: string): string => {
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
    case ".jsx":
      return "javascript";
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".yml":
    case ".yaml":
      return "yaml";
    default:
      return "plaintext";
  }
};

export const getProjectItemKind = (
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

export const buildProjectTree = (
  folderPath: string,
  manifest: ShadilyManifest,
): ProjectTreeNode[] => {
  const editablePaths = getEditablePaths(manifest);

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
