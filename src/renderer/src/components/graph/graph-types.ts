import type { ParsedGlslFunctionSignature } from "./internal/custom-node-glsl";
import type {
  GlslValue,
  GlslValueType,
  ValidatedUniformEditor,
} from "./internal/glsl-type-registry";
import type {
  CustomNode,
  GlFragColorNode,
  TimeNode,
  UniformNode,
  VaryingNode,
} from "./internal/json-schema";

export type {
  GlslValue,
  GlslValueType,
  ValidatedUniformEditor,
  Vec2Value,
  Vec3Value,
  Vec4Value,
} from "./internal/glsl-type-registry";

export type GraphSourceLoader = (
  filepath: string,
  node: CustomNode,
) => Promise<string> | string;

export type GraphUniformValue = GlslValue;
export type GraphUniformValues = Readonly<Record<string, GraphUniformValue>>;

export type ValidatedUniformBinding = {
  readonly defaultValue: GraphUniformValue;
  readonly key: string;
  readonly nodeIds: readonly string[];
  readonly valueType: GlslValueType;
};

export type ValidatedVaryingBinding = {
  readonly key: string;
  readonly nodeIds: readonly string[];
  readonly valueType: GlslValueType;
};

export type ValidatedTimeBinding = {
  readonly key: string;
  readonly nodeIds: readonly string[];
  readonly valueType: "float";
};

export type ValidatedUniformNode = {
  readonly defaultValue: GraphUniformValue;
  readonly definition: UniformNode;
  readonly displayName: string;
  readonly editor: ValidatedUniformEditor;
  readonly flowId: string;
  readonly kind: "uniform";
  readonly outputType: GlslValueType;
  readonly uniformBindingKey: string;
};

export type ValidatedVaryingNode = {
  readonly definition: VaryingNode;
  readonly displayName: string;
  readonly flowId: string;
  readonly kind: "varying";
  readonly outputType: GlslValueType;
  readonly varyingBindingKey: string;
};

export type ValidatedTimeNode = {
  readonly definition: TimeNode;
  readonly displayName: string;
  readonly flowId: string;
  readonly kind: "time";
  readonly outputType: "float";
  readonly timeBindingKey: string;
};

export type ValidatedCustomNode = {
  readonly definition: CustomNode;
  readonly displayName: string;
  readonly flowId: string;
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly kind: "custom";
  readonly outputType: GlslValueType;
  readonly signature: ParsedGlslFunctionSignature;
  readonly source: string;
};

export type ValidatedOutputNode = {
  readonly definition: GlFragColorNode;
  readonly displayName: string;
  readonly flowId: string;
  readonly kind: "glFragColor";
};

export type ValidatedValueNode =
  | ValidatedCustomNode
  | ValidatedTimeNode
  | ValidatedUniformNode
  | ValidatedVaryingNode;
export type ValidatedGraphNode =
  | ValidatedCustomNode
  | ValidatedOutputNode
  | ValidatedTimeNode
  | ValidatedUniformNode
  | ValidatedVaryingNode;

export type ValidatedGraphEdge = {
  readonly sourceNode: ValidatedValueNode;
  readonly sourceRef: string;
  readonly targetInputName: string;
  readonly targetNode: ValidatedCustomNode | ValidatedOutputNode;
  readonly valueType: GlslValueType;
};

export type ValidatedGraph = {
  readonly edges: readonly ValidatedGraphEdge[];
  readonly nodes: readonly ValidatedGraphNode[];
  readonly times: readonly ValidatedTimeBinding[];
  readonly uniforms: readonly ValidatedUniformBinding[];
  readonly varyings: readonly ValidatedVaryingBinding[];
};
