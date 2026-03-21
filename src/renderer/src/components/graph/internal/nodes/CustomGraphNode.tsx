import type { JSX } from "react";
import {
  createGraphNodeInputs,
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";
import type { CustomGraphNodeData } from "./node-data";

export type CustomGraphFlowNode = GraphFlowNode<CustomGraphNodeData, "custom">;

export const CustomGraphNode = ({
  data,
}: GraphFlowNodeProps<CustomGraphNodeData, "custom">): JSX.Element => (
  <GraphNodeFrame
    details={[
      {
        label: "File",
        value: data.definition.filepath,
      },
    ]}
    inputs={createGraphNodeInputs(Object.keys(data.definition.inputs))}
    title={data.definition.instanceName}
  />
);
