import { create } from "zustand";
import type {
  ProjectOpenResult,
  RecentProject,
  ShadilyManifest,
} from "../../../shared/contracts";

type ProjectState = {
  folderPath: string;
  manifest: ShadilyManifest;
  shaders: { fragment: string; vertex: string };
};

type ProjectStore = {
  readonly project: ProjectState | null;
  readonly activeFile: "fragment" | "vertex";
  readonly recentProjects: RecentProject[];

  readonly openProject: (result: ProjectOpenResult) => void;
  readonly closeProject: () => void;
  readonly setActiveFile: (file: "fragment" | "vertex") => void;
  readonly updateShader: (file: "fragment" | "vertex", source: string) => void;
  readonly setRecentProjects: (recents: RecentProject[]) => void;
};

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,
  activeFile: "fragment",
  recentProjects: [],

  openProject: (result) =>
    set({
      project: {
        folderPath: result.folderPath,
        manifest: result.manifest,
        shaders: result.shaders,
      },
    }),

  closeProject: () => set({ project: null }),

  setActiveFile: (file) => set({ activeFile: file }),

  updateShader: (file, source) =>
    set((state) => {
      if (state.project === null) return state;
      return {
        project: {
          ...state.project,
          shaders: { ...state.project.shaders, [file]: source },
        },
      };
    }),

  setRecentProjects: (recents) => set({ recentProjects: recents }),
}));
