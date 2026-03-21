import type { JSX } from "react";
import type { ColorNode } from "../json-schema";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type ColorGraphFlowNode = GraphFlowNode<ColorNode, "color">;

export const ColorGraphNode = ({
  data,
}: GraphFlowNodeProps<ColorNode, "color">): JSX.Element => (
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
