import { create } from "zustand";
import type {
  ProjectEntryResult,
  ProjectOpenResult,
  ProjectSavePayload,
  ProjectTextEntryResult,
  ProjectTreeNode,
  ShadilyManifest,
} from "../../../shared/contracts";
import {
  DEFAULT_FRAGMENT_SHADER,
  DEFAULT_VERTEX_SHADER,
} from "../../../shared/default-project";

type ShaderFileKey = "fragment" | "vertex";
type ProjectSavedFiles = Record<string, ProjectEntryResult>;
type ProjectDraftFiles = Record<string, string>;

export type ProjectState = {
  readonly folderPath: string;
  readonly manifest: ShadilyManifest;
  readonly tree: ProjectTreeNode[];
  readonly selectedEntryPath: string | null;
  readonly openTabPaths: string[];
  readonly aiNotifiedTabs: string[];
  readonly savedFiles: ProjectSavedFiles;
  readonly draftFiles: ProjectDraftFiles;
};

type ProjectStore = {
  readonly project: ProjectState | null;

  readonly openProject: (result: ProjectOpenResult) => void;
  readonly refreshProject: (result: ProjectOpenResult) => void;
  readonly commitSavedProject: (result: ProjectOpenResult) => void;
  readonly selectEntry: (path: string) => void;
  readonly openTab: (path: string) => void;
  readonly closeTab: (path: string) => void;
  readonly markTabsAiModified: (paths: string[]) => void;
  readonly setSavedDocument: (document: ProjectEntryResult) => void;
  readonly updateDraft: (path: string, content: string) => void;
};

export const normalizeProjectPath = (path: string): string =>
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
): ProjectTextEntryResult => ({
  path: normalizeProjectPath(path),
  kind: "text",
  language: "glsl",
  isEditable: true,
  content,
});

const getShaderDocumentPath = (
  manifest: ShadilyManifest,
  file: ShaderFileKey,
): string => normalizeProjectPath(manifest.shaders[file]);

const getDefaultSelectedEntryPath = (
  tree: readonly ProjectTreeNode[],
  manifest: ShadilyManifest,
): string | null => {
  const preferredPaths = [
    getShaderDocumentPath(manifest, "fragment"),
    getShaderDocumentPath(manifest, "vertex"),
  ];

  for (const preferredPath of preferredPaths) {
    if (hasFilePath(tree, preferredPath)) {
      return preferredPath;
    }
  }

  return findFirstFilePath(tree);
};

const filterSavedFiles = (
  savedFiles: ProjectSavedFiles,
  tree: readonly ProjectTreeNode[],
): ProjectSavedFiles =>
  Object.fromEntries(
    Object.entries(savedFiles).filter(([path]) => hasFilePath(tree, path)),
  );

const createSavedFiles = (
  result: ProjectOpenResult,
  previousProject: ProjectState | null,
): ProjectSavedFiles => {
  const savedFiles = filterSavedFiles(
    previousProject?.savedFiles ?? {},
    result.tree,
  );
  const fragmentPath = getShaderDocumentPath(result.manifest, "fragment");
  const vertexPath = getShaderDocumentPath(result.manifest, "vertex");

  return {
    ...savedFiles,
    [fragmentPath]: createShaderDocument(fragmentPath, result.shaders.fragment),
    [vertexPath]: createShaderDocument(vertexPath, result.shaders.vertex),
  };
};

const filterDraftFiles = (
  draftFiles: ProjectDraftFiles,
  tree: readonly ProjectTreeNode[],
  savedFiles: ProjectSavedFiles,
): ProjectDraftFiles =>
  Object.fromEntries(
    Object.entries(draftFiles).filter(([path, draftContent]) => {
      if (!hasFilePath(tree, path)) {
        return false;
      }

      const savedDocument = savedFiles[path];

      if (
        savedDocument === undefined ||
        savedDocument.kind !== "text" ||
        !savedDocument.isEditable
      ) {
        return false;
      }

      return savedDocument.content !== draftContent;
    }),
  );

const filterTabPaths = (
  paths: string[],
  tree: readonly ProjectTreeNode[],
): string[] => paths.filter((p) => hasFilePath(tree, p));

const createProjectState = (
  result: ProjectOpenResult,
  previousProject: ProjectState | null,
  mode: "open" | "refresh" | "commit",
): ProjectState => {
  const tree = result.tree;
  const savedFiles = createSavedFiles(result, previousProject);
  const draftFiles =
    mode === "open"
      ? {}
      : filterDraftFiles(previousProject?.draftFiles ?? {}, tree, savedFiles);

  const preferredSelection =
    previousProject?.selectedEntryPath !== null &&
    previousProject?.selectedEntryPath !== undefined &&
    hasFilePath(tree, previousProject.selectedEntryPath)
      ? previousProject.selectedEntryPath
      : null;

  if (mode === "commit") {
    delete draftFiles[getShaderDocumentPath(result.manifest, "fragment")];
    delete draftFiles[getShaderDocumentPath(result.manifest, "vertex")];
  }

  const selectedEntryPath =
    preferredSelection ?? getDefaultSelectedEntryPath(tree, result.manifest);

  let openTabPaths: string[];
  let aiNotifiedTabs: string[];

  if (mode === "open") {
    openTabPaths = selectedEntryPath !== null ? [selectedEntryPath] : [];
    aiNotifiedTabs = [];
  } else {
    const prevOpenTabs = filterTabPaths(
      previousProject?.openTabPaths ?? [],
      tree,
    );
    const prevAiNotified = filterTabPaths(
      previousProject?.aiNotifiedTabs ?? [],
      tree,
    );
    // ensure selected tab is in the list
    openTabPaths =
      selectedEntryPath !== null && !prevOpenTabs.includes(selectedEntryPath)
        ? [...prevOpenTabs, selectedEntryPath]
        : prevOpenTabs;
    aiNotifiedTabs = prevAiNotified;
  }

  return {
    folderPath: result.folderPath,
    manifest: result.manifest,
    tree,
    selectedEntryPath,
    openTabPaths,
    aiNotifiedTabs,
    savedFiles,
    draftFiles,
  };
};

export const getSavedProjectDocument = (
  project: ProjectState,
  path: string,
): ProjectEntryResult | null =>
  project.savedFiles[normalizeProjectPath(path)] ?? null;

export const getProjectDocument = (
  project: ProjectState,
  path: string,
): ProjectEntryResult | null => {
  const normalizedPath = normalizeProjectPath(path);
  const savedDocument = project.savedFiles[normalizedPath] ?? null;

  if (savedDocument === null || savedDocument.kind !== "text") {
    return savedDocument;
  }

  const draftContent = project.draftFiles[normalizedPath];

  return draftContent === undefined
    ? savedDocument
    : {
        ...savedDocument,
        content: draftContent,
      };
};

export const getProjectShaderSource = (
  project: ProjectState | null,
  file: ShaderFileKey,
): string => {
  if (project === null) {
    return file === "fragment"
      ? DEFAULT_FRAGMENT_SHADER
      : DEFAULT_VERTEX_SHADER;
  }

  const document = getProjectDocument(
    project,
    getShaderDocumentPath(project.manifest, file),
  );

  if (document?.kind !== "text") {
    return file === "fragment"
      ? DEFAULT_FRAGMENT_SHADER
      : DEFAULT_VERTEX_SHADER;
  }

  return document.content;
};

export const createProjectSavePayload = (
  project: ProjectState,
): ProjectSavePayload => ({
  folderPath: project.folderPath,
  manifest: project.manifest,
  shaders: {
    fragment: getProjectShaderSource(project, "fragment"),
    vertex: getProjectShaderSource(project, "vertex"),
  },
});

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,

  openProject: (result) =>
    set({
      project: createProjectState(result, null, "open"),
    }),

  refreshProject: (result) =>
    set((state) => ({
      project: createProjectState(result, state.project, "refresh"),
    })),

  commitSavedProject: (result) =>
    set((state) => ({
      project: createProjectState(result, state.project, "commit"),
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

      const openTabPaths = state.project.openTabPaths.includes(projectPath)
        ? state.project.openTabPaths
        : [...state.project.openTabPaths, projectPath];

      const aiNotifiedTabs = state.project.aiNotifiedTabs.filter(
        (p) => p !== projectPath,
      );

      return {
        project: {
          ...state.project,
          selectedEntryPath: projectPath,
          openTabPaths,
          aiNotifiedTabs,
        },
      };
    }),

  openTab: (path) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      const projectPath = normalizeProjectPath(path);

      if (!hasFilePath(state.project.tree, projectPath)) {
        return state;
      }

      const openTabPaths = state.project.openTabPaths.includes(projectPath)
        ? state.project.openTabPaths
        : [...state.project.openTabPaths, projectPath];

      const aiNotifiedTabs = state.project.aiNotifiedTabs.filter(
        (p) => p !== projectPath,
      );

      return {
        project: {
          ...state.project,
          selectedEntryPath: projectPath,
          openTabPaths,
          aiNotifiedTabs,
        },
      };
    }),

  closeTab: (path) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      const projectPath = normalizeProjectPath(path);
      const { openTabPaths, selectedEntryPath, aiNotifiedTabs } = state.project;
      const tabIndex = openTabPaths.indexOf(projectPath);

      if (tabIndex === -1) {
        return state;
      }

      const nextOpenTabPaths = openTabPaths.filter((p) => p !== projectPath);
      const nextAiNotifiedTabs = aiNotifiedTabs.filter(
        (p) => p !== projectPath,
      );

      let nextSelectedEntryPath = selectedEntryPath;

      if (selectedEntryPath === projectPath) {
        // pick adjacent tab
        if (nextOpenTabPaths.length === 0) {
          nextSelectedEntryPath = null;
        } else {
          const preferredIndex = Math.min(tabIndex, nextOpenTabPaths.length - 1);
          nextSelectedEntryPath = nextOpenTabPaths[preferredIndex] ?? null;
        }
      }

      return {
        project: {
          ...state.project,
          selectedEntryPath: nextSelectedEntryPath,
          openTabPaths: nextOpenTabPaths,
          aiNotifiedTabs: nextAiNotifiedTabs,
        },
      };
    }),

  markTabsAiModified: (paths) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      const { openTabPaths, selectedEntryPath, aiNotifiedTabs } = state.project;
      const nextAiNotifiedTabs = [...aiNotifiedTabs];

      for (const rawPath of paths) {
        const projectPath = normalizeProjectPath(rawPath);

        if (
          openTabPaths.includes(projectPath) &&
          projectPath !== selectedEntryPath &&
          !nextAiNotifiedTabs.includes(projectPath)
        ) {
          nextAiNotifiedTabs.push(projectPath);
        }
      }

      if (nextAiNotifiedTabs.length === aiNotifiedTabs.length) {
        return state;
      }

      return {
        project: {
          ...state.project,
          aiNotifiedTabs: nextAiNotifiedTabs,
        },
      };
    }),

  setSavedDocument: (document) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      const projectPath = normalizeProjectPath(document.path);

      if (!hasFilePath(state.project.tree, projectPath)) {
        return state;
      }

      const nextSavedDocument = {
        ...document,
        path: projectPath,
      };
      const nextDraftFiles = { ...state.project.draftFiles };

      if (
        nextSavedDocument.kind === "text" &&
        nextDraftFiles[projectPath] === nextSavedDocument.content
      ) {
        delete nextDraftFiles[projectPath];
      }

      return {
        project: {
          ...state.project,
          savedFiles: {
            ...state.project.savedFiles,
            [projectPath]: nextSavedDocument,
          },
          draftFiles: nextDraftFiles,
        },
      };
    }),

  updateDraft: (path, content) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      const projectPath = normalizeProjectPath(path);
      const savedDocument = state.project.savedFiles[projectPath];

      if (
        !hasFilePath(state.project.tree, projectPath) ||
        savedDocument === undefined ||
        savedDocument.kind !== "text" ||
        !savedDocument.isEditable
      ) {
        return state;
      }

      const nextDraftFiles = { ...state.project.draftFiles };

      if (savedDocument.content === content) {
        delete nextDraftFiles[projectPath];
      } else {
        nextDraftFiles[projectPath] = content;
      }

      return {
        project: {
          ...state.project,
          draftFiles: nextDraftFiles,
        },
      };
    }),
}));
