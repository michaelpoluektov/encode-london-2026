import type {
  BoolNode,
  ColorNode,
  ColorValue,
  CustomNode,
  FloatNode,
  GlFragColorNode,
  IntNode,
  Vec2Node,
  Vec2Value,
  Vec3Node,
  Vec3Value,
  Vec4Node,
  Vec4Value,
} from "../json-schema";

type GraphNodeData<Definition> = {
  readonly definition: Definition;
};

type InteractiveGraphNodeData<Definition, Value> = GraphNodeData<Definition> & {
  readonly onValueChange: (nextValue: Value) => void;
  readonly value: Value;
};

export type CustomGraphNodeData = GraphNodeData<CustomNode>;

export type BoolGraphNodeData = InteractiveGraphNodeData<BoolNode, boolean>;
export type ColorGraphNodeData = InteractiveGraphNodeData<
  ColorNode,
  ColorValue
>;
export type FloatGraphNodeData = InteractiveGraphNodeData<FloatNode, number>;
export type GlFragColorGraphNodeData = GraphNodeData<GlFragColorNode>;
export type IntGraphNodeData = InteractiveGraphNodeData<IntNode, number>;
export type Vec2GraphNodeData = InteractiveGraphNodeData<Vec2Node, Vec2Value>;
export type Vec3GraphNodeData = InteractiveGraphNodeData<Vec3Node, Vec3Value>;
export type Vec4GraphNodeData = InteractiveGraphNodeData<Vec4Node, Vec4Value>;
