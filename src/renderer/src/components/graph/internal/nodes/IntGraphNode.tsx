import type { JSX } from "react";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  type GraphNodeDetail,
  GraphNodeFrame,
} from "./GraphNode";
import { graphNodeNumberInput } from "./graph-node.css";
import type { IntGraphNodeData } from "./node-data";

export type IntGraphFlowNode = GraphFlowNode<IntGraphNodeData, "int">;

const readIntegerInputValue = (
  rawValue: string,
  fallbackValue: number,
): number => {
  if (rawValue.trim() === "") {
    return fallbackValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return fallbackValue;
  }

  return Math.round(parsedValue);
};

export const IntGraphNode = ({
  data,
}: GraphFlowNodeProps<IntGraphNodeData, "int">): JSX.Element => {
  const details: GraphNodeDetail[] = [
    {
      label: "uniform",
      value: data.definition.uniformName,
    },
  ];

  return (
    <GraphNodeFrame
      controls={
        <input
          aria-label={`${data.definition.instanceName} value`}
          className={`${graphNodeNumberInput} nodrag nowheel nopan`}
          inputMode="numeric"
          onChange={(event) => {
            data.onValueChange(
              readIntegerInputValue(event.currentTarget.value, data.value),
            );
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          step={1}
          type="number"
          value={data.value}
        />
      }
      details={details}
      title={data.definition.instanceName}
    />
  );
};
