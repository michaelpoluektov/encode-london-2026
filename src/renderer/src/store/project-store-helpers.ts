import type {
  ProjectEntryResult,
  ProjectOpenResult,
  ProjectSavePayload,
  ProjectTextEntryResult,
  ProjectTreeNode,
  ShadilyManifest,
} from "../../../shared/contracts";
import { DEFAULT_GRAPH_SOURCE } from "../../../shared/default-project";
import { normalizeProjectPath } from "../../../shared/path-utils";
import type { ProjectState } from "./project-store";

type ProjectSavedFiles = Record<string, ProjectEntryResult>;
type ProjectDraftFiles = Record<string, string>;

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

const createGraphDocument = (
  path: string,
  content: string,
): ProjectTextEntryResult => ({
  path: normalizeProjectPath(path),
  kind: "text",
  language: "json",
  isEditable: true,
  content,
});

export const getGraphDocumentPath = (manifest: ShadilyManifest): string =>
  normalizeProjectPath(manifest.graph.source);

const getDefaultSelectedEntryPath = (
  tree: readonly ProjectTreeNode[],
  manifest: ShadilyManifest,
): string | null => {
  const preferredPath = getGraphDocumentPath(manifest);

  if (hasFilePath(tree, preferredPath)) {
    return preferredPath;
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
  const graphPath = getGraphDocumentPath(result.manifest);

  return {
    ...savedFiles,
    [graphPath]: createGraphDocument(graphPath, result.graphSource),
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
): string[] => paths.filter((path) => hasFilePath(tree, path));

export const createProjectState = (
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
    delete draftFiles[getGraphDocumentPath(result.manifest)];
  }

  const selectedEntryPath =
    preferredSelection ?? getDefaultSelectedEntryPath(tree, result.manifest);

  const [openTabPaths, aiNotifiedTabs] =
    mode === "open"
      ? [selectedEntryPath !== null ? [selectedEntryPath] : [], []]
      : (() => {
          const prevOpenTabs = filterTabPaths(
            previousProject?.openTabPaths ?? [],
            tree,
          );
          const prevAiNotified = filterTabPaths(
            previousProject?.aiNotifiedTabs ?? [],
            tree,
          );

          return [
            selectedEntryPath !== null &&
            !prevOpenTabs.includes(selectedEntryPath)
              ? [...prevOpenTabs, selectedEntryPath]
              : prevOpenTabs,
            prevAiNotified,
          ] as const;
        })();

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

export const getProjectGraphSource = (project: ProjectState | null): string => {
  if (project === null) {
    return DEFAULT_GRAPH_SOURCE;
  }

  const document = getProjectDocument(
    project,
    getGraphDocumentPath(project.manifest),
  );

  if (document?.kind !== "text") {
    return DEFAULT_GRAPH_SOURCE;
  }

  return document.content;
};

export const createProjectSavePayload = (
  project: ProjectState,
): ProjectSavePayload => ({
  folderPath: project.folderPath,
  manifest: project.manifest,
  graphSource: getProjectGraphSource(project),
});

export const selectProjectEntry = (
  project: ProjectState,
  path: string,
): ProjectState => {
  const projectPath = normalizeProjectPath(path);

  if (!hasFilePath(project.tree, projectPath)) {
    return project;
  }

  const openTabPaths = project.openTabPaths.includes(projectPath)
    ? project.openTabPaths
    : [...project.openTabPaths, projectPath];

  return {
    ...project,
    selectedEntryPath: projectPath,
    openTabPaths,
    aiNotifiedTabs: project.aiNotifiedTabs.filter(
      (entryPath) => entryPath !== projectPath,
    ),
  };
};

export const closeProjectTab = (
  project: ProjectState,
  path: string,
): ProjectState => {
  const projectPath = normalizeProjectPath(path);
  const tabIndex = project.openTabPaths.indexOf(projectPath);

  if (tabIndex === -1) {
    return project;
  }

  const nextOpenTabPaths = project.openTabPaths.filter(
    (entryPath) => entryPath !== projectPath,
  );
  const nextAiNotifiedTabs = project.aiNotifiedTabs.filter(
    (entryPath) => entryPath !== projectPath,
  );

  const nextSelectedEntryPath =
    project.selectedEntryPath !== projectPath
      ? project.selectedEntryPath
      : nextOpenTabPaths.length === 0
        ? null
        : (nextOpenTabPaths[Math.min(tabIndex, nextOpenTabPaths.length - 1)] ??
          null);

  return {
    ...project,
    selectedEntryPath: nextSelectedEntryPath,
    openTabPaths: nextOpenTabPaths,
    aiNotifiedTabs: nextAiNotifiedTabs,
  };
};

export const markProjectTabsAiModified = (
  project: ProjectState,
  paths: string[],
): ProjectState => {
  const nextAiNotifiedTabs = [...project.aiNotifiedTabs];

  for (const rawPath of paths) {
    const projectPath = normalizeProjectPath(rawPath);

    if (
      project.openTabPaths.includes(projectPath) &&
      projectPath !== project.selectedEntryPath &&
      !nextAiNotifiedTabs.includes(projectPath)
    ) {
      nextAiNotifiedTabs.push(projectPath);
    }
  }

  return nextAiNotifiedTabs.length === project.aiNotifiedTabs.length
    ? project
    : {
        ...project,
        aiNotifiedTabs: nextAiNotifiedTabs,
      };
};

export const setProjectSavedDocument = (
  project: ProjectState,
  document: ProjectEntryResult,
): ProjectState => {
  const projectPath = normalizeProjectPath(document.path);

  if (!hasFilePath(project.tree, projectPath)) {
    return project;
  }

  const nextSavedDocument = {
    ...document,
    path: projectPath,
  };
  const nextDraftFiles = { ...project.draftFiles };

  if (
    nextSavedDocument.kind === "text" &&
    nextDraftFiles[projectPath] === nextSavedDocument.content
  ) {
    delete nextDraftFiles[projectPath];
  }

  return {
    ...project,
    savedFiles: {
      ...project.savedFiles,
      [projectPath]: nextSavedDocument,
    },
    draftFiles: nextDraftFiles,
  };
};

export const updateProjectDraft = (
  project: ProjectState,
  path: string,
  content: string,
): ProjectState => {
  const projectPath = normalizeProjectPath(path);
  const savedDocument = project.savedFiles[projectPath];

  if (
    !hasFilePath(project.tree, projectPath) ||
    savedDocument === undefined ||
    savedDocument.kind !== "text" ||
    !savedDocument.isEditable
  ) {
    return project;
  }

  const nextDraftFiles = { ...project.draftFiles };

  if (savedDocument.content === content) {
    delete nextDraftFiles[projectPath];
  } else {
    nextDraftFiles[projectPath] = content;
  }

  return {
    ...project,
    draftFiles: nextDraftFiles,
  };
};
