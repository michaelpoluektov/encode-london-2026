import defaultGraphDefinition from "../project-template/graph.json";
import defaultPulseNodeSource from "../project-template/nodes/pulse.glsl?raw";
import defaultVertexShaderSource from "../project-template/vertex.vert?raw";
import type { ShadilyManifest } from "./contracts";

export const PREVIEW_MODEL_IDS = ["sphere", "plane"] as const;
export type PreviewModelId = (typeof PREVIEW_MODEL_IDS)[number];

export const PREVIEW_MODELS: Array<{ id: PreviewModelId; label: string }> = [
  { id: "sphere", label: "Sphere" },
  { id: "plane", label: "Plane" },
];

const normalizeTemplateText = (text: string): string =>
  text.replaceAll("\r\n", "\n").trimEnd();

export const DEFAULT_PROJECT_FILE_PATHS = {
  agentInstructions: "AGENTS.md",
  capturesDir: "captures",
  docsDir: "docs",
  graph: "graph.json",
  manifest: "shadily.json",
  nodesDir: "nodes",
  vertex: "vertex.vert",
} as const;

export const DEFAULT_VERTEX_SHADER = normalizeTemplateText(
  defaultVertexShaderSource,
);

export const DEFAULT_GRAPH_SOURCE = JSON.stringify(
  defaultGraphDefinition,
  null,
  2,
);

export const DEFAULT_NODE_GLSL_FILES: Readonly<Record<string, string>> = {
  "pulse.glsl": normalizeTemplateText(defaultPulseNodeSource),
};

export type DefaultProjectContents = {
  readonly manifest: ShadilyManifest;
  readonly graphSource: string;
};

export const createDefaultProjectContents = (
  name: string,
  timestamp = new Date().toISOString(),
): DefaultProjectContents => ({
  manifest: {
    projectId: crypto.randomUUID(),
    name,
    version: "2",
    graph: { source: DEFAULT_PROJECT_FILE_PATHS.graph },
    preview: { mesh: "sphere" },
    created: timestamp,
    modified: timestamp,
  },
  graphSource: DEFAULT_GRAPH_SOURCE,
});
