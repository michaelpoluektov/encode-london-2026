import type { JSX } from "react";
import type { CustomNode } from "../../dag/dag-schema";
import {
  createGraphNodeInputs,
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type CustomGraphFlowNode = GraphFlowNode<CustomNode, "custom">;

export const CustomGraphNode = ({
  data,
}: GraphFlowNodeProps<CustomNode, "custom">): JSX.Element => (
  <GraphNodeFrame
    details={[
      {
        label: "File",
        value: data.filepath,
      },
    ]}
    inputs={createGraphNodeInputs(Object.keys(data.inputs))}
    title={`${data.instanceName} (${data.kind})`}
  />
);
