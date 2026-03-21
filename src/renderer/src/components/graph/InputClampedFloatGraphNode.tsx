import type { JSX } from "react";
import type { InputClampedFloatNode } from "../../dag/dag-schema";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type InputClampedFloatGraphFlowNode = GraphFlowNode<
  InputClampedFloatNode,
  "input_clamped_float"
>;

export const InputClampedFloatGraphNode = ({
  data,
}: GraphFlowNodeProps<
  InputClampedFloatNode,
  "input_clamped_float"
>): JSX.Element => (
  <GraphNodeFrame
    details={[
      {
        label: "uniform",
        value: data.uniformName,
      },
    ]}
    title={`${data.instanceName} (${data.kind})`}
  />
);
