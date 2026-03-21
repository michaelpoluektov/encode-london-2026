import type { JSX } from "react";
import type { FloatNode } from "../json-schema";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  type GraphNodeDetail,
  GraphNodeFrame,
} from "./GraphNode";

export type FloatGraphFlowNode = GraphFlowNode<FloatNode, "float">;

export const FloatGraphNode = ({
  data,
}: GraphFlowNodeProps<FloatNode, "float">): JSX.Element => {
  const details: GraphNodeDetail[] = [
    {
      label: "uniform",
      value: data.uniformName,
    },
  ];

  if (data.min !== undefined || data.max !== undefined) {
    details.push({
      label: "range",
      value: `${data.min ?? "-inf"} to ${data.max ?? "+inf"}`,
    });
  }

  return <GraphNodeFrame details={details} title={data.instanceName} />;
};
