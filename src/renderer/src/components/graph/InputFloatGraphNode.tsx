import type { JSX } from "react";
import type { InputFloatNode } from "../../dag/dag-schema";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type InputFloatGraphFlowNode = GraphFlowNode<
  InputFloatNode,
  "input_float"
>;

export const InputFloatGraphNode = ({
  data,
}: GraphFlowNodeProps<InputFloatNode, "input_float">): JSX.Element => (
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
