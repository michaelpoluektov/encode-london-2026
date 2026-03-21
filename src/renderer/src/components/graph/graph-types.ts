import type { CustomNode, GraphNodeDefinition } from "./internal/json-schema";

export type GlslValueType = "bool" | "float" | "int" | "vec2" | "vec3" | "vec4";

export type GraphSourceLoader = (
  filepath: string,
  node: CustomNode,
) => Promise<string> | string;

export type ValidatedGraphNode = {
  readonly displayName: string;
  readonly flowId: string;
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly outputType: GlslValueType | null;
  readonly definition: GraphNodeDefinition;
};

export type ValidatedGraphEdge = {
  readonly sourceNode: ValidatedGraphNode;
  readonly sourceRef: string;
  readonly targetInputName: string;
  readonly targetNode: ValidatedGraphNode;
  readonly valueType: GlslValueType;
};

export type ValidatedGraph = {
  readonly edges: readonly ValidatedGraphEdge[];
  readonly nodes: readonly ValidatedGraphNode[];
};
