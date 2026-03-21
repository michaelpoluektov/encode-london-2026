import type {
  ColorValue,
  CustomNode,
  GraphNodeDefinition,
  Vec2Value,
  Vec3Value,
  Vec4Value,
} from "./internal/json-schema";

export type GlslValueType = "bool" | "float" | "int" | "vec2" | "vec3" | "vec4";

export type GraphSourceLoader = (
  filepath: string,
  node: CustomNode,
) => Promise<string> | string;

export type GraphInputValue =
  | ColorValue
  | Vec2Value
  | Vec3Value
  | Vec4Value
  | boolean
  | number;

export type ValidatedGraphNode = {
  readonly displayName: string;
  readonly flowId: string;
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly outputType: GlslValueType | null;
  readonly uniformBindingKey: string | null;
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
