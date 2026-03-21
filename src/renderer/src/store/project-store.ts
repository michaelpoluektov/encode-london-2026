import { create } from "zustand";
import type {
  ProjectEntryResult,
  ProjectOpenResult,
  ProjectTreeNode,
  ShadilyManifest,
} from "../../../shared/contracts";

type ProjectDocuments = Record<string, ProjectEntryResult>;

type ProjectState = {
  folderPath: string;
  manifest: ShadilyManifest;
  shaders: { fragment: string; vertex: string };
  tree: ProjectTreeNode[];
  selectedEntryPath: string | null;
  documents: ProjectDocuments;
};

type ProjectStore = {
  readonly project: ProjectState | null;

  readonly openProject: (result: ProjectOpenResult) => void;
  readonly refreshProject: (result: ProjectOpenResult) => void;
  readonly selectEntry: (path: string) => void;
  readonly setDocument: (document: ProjectEntryResult) => void;
  readonly updateShader: (file: "fragment" | "vertex", source: string) => void;
};

const normalizeProjectPath = (path: string): string =>
  path.replaceAll("\\", "/");

const hasFilePath = (
  nodes: readonly ProjectTreeNode[],
  targetPath: string,
): boolean =>
  nodes.some((node) => {
    if (node.kind === "file" && node.path === targetPath) {
      return true;
    }

    return node.children ? hasFilePath(node.children, targetPath) : false;
  });

const findFirstFilePath = (
  nodes: readonly ProjectTreeNode[],
): string | null => {
  for (const node of nodes) {
    if (node.kind === "file") {
      return node.path;
    }

    if (node.children) {
      const childMatch = findFirstFilePath(node.children);

      if (childMatch !== null) {
        return childMatch;
      }
    }
  }

  return null;
};

const createShaderDocument = (
  path: string,
  content: string,
): ProjectEntryResult => ({
  path: normalizeProjectPath(path),
  kind: "text",
  language: "glsl",
  isEditable: true,
  content,
});

const getDefaultSelectedEntryPath = (
  tree: readonly ProjectTreeNode[],
  manifest: ShadilyManifest,
): string | null => {
  const preferredPaths = [
    normalizeProjectPath(manifest.shaders.fragment),
    normalizeProjectPath(manifest.shaders.vertex),
  ];

  for (const preferredPath of preferredPaths) {
    if (hasFilePath(tree, preferredPath)) {
      return preferredPath;
    }
  }

  return findFirstFilePath(tree);
};

const createProjectState = (
  result: ProjectOpenResult,
  previousProject: ProjectState | null,
): ProjectState => {
  const tree = result.tree;
  const fragmentPath = normalizeProjectPath(result.manifest.shaders.fragment);
  const vertexPath = normalizeProjectPath(result.manifest.shaders.vertex);
  const documents = {
    [fragmentPath]: createShaderDocument(fragmentPath, result.shaders.fragment),
    [vertexPath]: createShaderDocument(vertexPath, result.shaders.vertex),
  } satisfies ProjectDocuments;

  const preferredSelection =
    previousProject?.selectedEntryPath !== null &&
    previousProject?.selectedEntryPath !== undefined &&
    hasFilePath(tree, previousProject.selectedEntryPath)
      ? previousProject.selectedEntryPath
      : null;

  return {
    folderPath: result.folderPath,
    manifest: result.manifest,
    shaders: result.shaders,
    tree,
    selectedEntryPath:
      preferredSelection ?? getDefaultSelectedEntryPath(tree, result.manifest),
    documents,
  };
};

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,

  openProject: (result) =>
    set({
      project: createProjectState(result, null),
    }),

  refreshProject: (result) =>
    set((state) => ({
      project: createProjectState(result, state.project),
    })),

  selectEntry: (path) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      const projectPath = normalizeProjectPath(path);

      if (!hasFilePath(state.project.tree, projectPath)) {
        return state;
      }

      return {
        project: {
          ...state.project,
          selectedEntryPath: projectPath,
        },
      };
    }),

  setDocument: (document) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      const projectPath = normalizeProjectPath(document.path);

      if (!hasFilePath(state.project.tree, projectPath)) {
        return state;
      }

      return {
        project: {
          ...state.project,
          documents: {
            ...state.project.documents,
            [projectPath]: {
              ...document,
              path: projectPath,
            },
          },
        },
      };
    }),

  updateShader: (file, source) =>
    set((state) => {
      if (state.project === null) return state;

      const shaderPath = normalizeProjectPath(
        state.project.manifest.shaders[file],
      );

      return {
        project: {
          ...state.project,
          shaders: {
            ...state.project.shaders,
            [file]: source,
          },
          documents: {
            ...state.project.documents,
            [shaderPath]: createShaderDocument(shaderPath, source),
          },
        },
      };
    }),
}));
