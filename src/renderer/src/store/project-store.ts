import { create } from "zustand";
import type {
  ProjectEntryResult,
  ProjectOpenResult,
  ProjectTreeNode,
  ShadilyManifest,
} from "../../../shared/contracts";
import type { PreviewModelId } from "../../../shared/default-project";
import {
  closeProjectTab,
  createProjectState,
  markProjectTabsAiModified,
  selectProjectEntry,
  setProjectPreviewMesh,
  setProjectSavedDocument,
  updateProjectDraft,
} from "./project-store-helpers";

export {
  createProjectSavePayload,
  getProjectDocument,
  getProjectGraphSource,
  getProjectVertexSource,
  getSavedProjectDocument,
} from "./project-store-helpers";

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
  readonly setExternallySavedDocument: (document: ProjectEntryResult) => void;
  readonly updateDraft: (path: string, content: string) => void;
  readonly updatePreviewMesh: (mesh: PreviewModelId) => void;
};

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

      return {
        project: selectProjectEntry(state.project, path),
      };
    }),

  openTab: (path) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      return {
        project: selectProjectEntry(state.project, path),
      };
    }),

  closeTab: (path) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      return {
        project: closeProjectTab(state.project, path),
      };
    }),

  markTabsAiModified: (paths) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      return {
        project: markProjectTabsAiModified(state.project, paths),
      };
    }),

  setSavedDocument: (document) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      return {
        project: setProjectSavedDocument(state.project, document),
      };
    }),

  setExternallySavedDocument: (document) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      return {
        project: setProjectSavedDocument(state.project, document, {
          discardDraft: true,
        }),
      };
    }),

  updateDraft: (path, content) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      return {
        project: updateProjectDraft(state.project, path, content),
      };
    }),

  updatePreviewMesh: (mesh) =>
    set((state) => {
      if (state.project === null) {
        return state;
      }

      return {
        project: setProjectPreviewMesh(state.project, mesh),
      };
    }),
}));
