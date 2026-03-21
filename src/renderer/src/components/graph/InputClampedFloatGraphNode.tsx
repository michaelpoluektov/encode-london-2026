import type { JSX } from "react";
import type { ClampedFloatNode } from "../../dag/dag-schema";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

const formatClampedFloatRange = (value: number): string => value.toFixed(2);

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
    title={`${data.instanceName} (float[${formatClampedFloatRange(data.min)}, ${formatClampedFloatRange(data.max)}])`}
  />
);
