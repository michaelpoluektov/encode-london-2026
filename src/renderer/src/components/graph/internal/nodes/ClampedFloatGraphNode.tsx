import type { JSX } from "react";
import type { ClampedFloatNode } from "../../dag-schema";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type ClampedFloatGraphFlowNode = GraphFlowNode<
  ClampedFloatNode,
  "clampedFloat"
>;

export const ClampedFloatGraphNode = ({
  data,
}: GraphFlowNodeProps<ClampedFloatNode, "clampedFloat">): JSX.Element => (
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
