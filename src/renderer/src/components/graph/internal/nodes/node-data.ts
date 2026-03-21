import type {
  ColorNode,
  ColorValue,
  CustomNode,
  FloatNode,
  GlFragColorNode,
} from "../json-schema";

type GraphNodeData<Definition> = {
  readonly definition: Definition;
};

export type ColorGraphNodeData = GraphNodeData<ColorNode> & {
  readonly onValueChange: (nextValue: ColorValue) => void;
  readonly value: ColorValue;
};

export type CustomGraphNodeData = GraphNodeData<CustomNode>;

export type FloatGraphNodeData = GraphNodeData<FloatNode> & {
  readonly onValueChange: (nextValue: number) => void;
  readonly value: number;
};

export type GlFragColorGraphNodeData = GraphNodeData<GlFragColorNode>;
