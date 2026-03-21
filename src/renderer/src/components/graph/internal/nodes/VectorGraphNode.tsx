import type { JSX } from "react";
import { Text } from "../../../ui/Text";
import type { Vec2Value, Vec3Value, Vec4Value } from "../json-schema";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  type GraphNodeDetail,
  GraphNodeFrame,
} from "./GraphNode";
import {
  graphNodeNumberInput,
  graphNodeVectorControls,
  graphNodeVectorLabel,
  graphNodeVectorRow,
} from "./graph-node.css";
import type {
  Vec2GraphNodeData,
  Vec3GraphNodeData,
  Vec4GraphNodeData,
} from "./node-data";

export type Vec2GraphFlowNode = GraphFlowNode<Vec2GraphNodeData, "vec2">;
export type Vec3GraphFlowNode = GraphFlowNode<Vec3GraphNodeData, "vec3">;
export type Vec4GraphFlowNode = GraphFlowNode<Vec4GraphNodeData, "vec4">;

type VectorValue = Vec2Value | Vec3Value | Vec4Value;

const readNumberInputValue = (
  rawValue: string,
  fallbackValue: number,
): number => {
  if (rawValue.trim() === "") {
    return fallbackValue;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
};

const createNodeDetails = (uniformName: string): GraphNodeDetail[] => [
  {
    label: "uniform",
    value: uniformName,
  },
];

const VectorGraphNodeControls = <Value extends Record<string, number>>({
  componentNames,
  onValueChange,
  value,
}: {
  readonly componentNames: readonly (keyof Value & string)[];
  readonly onValueChange: (nextValue: Value) => void;
  readonly value: Value;
}): JSX.Element => (
  <div className={graphNodeVectorControls}>
    {componentNames.map((componentName) => (
      <label className={`${graphNodeVectorRow} nopan`} key={componentName}>
        <Text
          as="span"
          className={graphNodeVectorLabel}
          tone="muted"
          variant="label"
        >
          {componentName}
        </Text>
        <input
          aria-label={componentName}
          className={`${graphNodeNumberInput} nodrag nowheel nopan`}
          inputMode="decimal"
          onChange={(event) => {
            onValueChange({
              ...value,
              [componentName]: readNumberInputValue(
                event.currentTarget.value,
                value[componentName],
              ),
            });
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          step="any"
          type="number"
          value={value[componentName]}
        />
      </label>
    ))}
  </div>
);

const renderVectorGraphNode = <Value extends VectorValue>({
  componentNames,
  data,
}: {
  readonly componentNames: readonly (keyof Value & string)[];
  readonly data: {
    readonly definition: {
      readonly instanceName: string;
      readonly uniformName: string;
    };
    readonly onValueChange: (nextValue: Value) => void;
    readonly value: Value;
  };
}): JSX.Element => (
  <GraphNodeFrame
    controls={
      <VectorGraphNodeControls
        componentNames={componentNames}
        onValueChange={data.onValueChange}
        value={data.value}
      />
    }
    details={createNodeDetails(data.definition.uniformName)}
    title={data.definition.instanceName}
  />
);

export const Vec2GraphNode = ({
  data,
}: GraphFlowNodeProps<Vec2GraphNodeData, "vec2">): JSX.Element =>
  renderVectorGraphNode<Vec2Value>({
    componentNames: ["x", "y"],
    data,
  });

export const Vec3GraphNode = ({
  data,
}: GraphFlowNodeProps<Vec3GraphNodeData, "vec3">): JSX.Element =>
  renderVectorGraphNode<Vec3Value>({
    componentNames: ["x", "y", "z"],
    data,
  });

export const Vec4GraphNode = ({
  data,
}: GraphFlowNodeProps<Vec4GraphNodeData, "vec4">): JSX.Element =>
  renderVectorGraphNode<Vec4Value>({
    componentNames: ["x", "y", "z", "w"],
    data,
  });
