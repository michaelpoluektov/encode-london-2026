import type { JSX } from "react";
import type { FloatNode } from "../json-schema";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type FloatGraphFlowNode = GraphFlowNode<FloatNode, "float">;

export const FloatGraphNode = ({
  data,
}: GraphFlowNodeProps<FloatNode, "float">): JSX.Element => (
  <GraphNodeFrame
    details={[
      {
        label: "uniform",
        value: data.uniformName,
      },
    ]}
    title={data.instanceName}
  />
);
