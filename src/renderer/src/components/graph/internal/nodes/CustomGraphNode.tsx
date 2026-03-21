import type { JSX } from "react";
import type { ValidatedCustomNode } from "../../graph-types";
import {
  createGraphNodeInputs,
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

export type CustomGraphNodeData = {
  readonly node: ValidatedCustomNode;
};

export type CustomGraphFlowNode = GraphFlowNode<CustomGraphNodeData, "custom">;

export const CustomGraphNode = ({
  data,
}: GraphFlowNodeProps<CustomGraphNodeData, "custom">): JSX.Element => (
  <GraphNodeFrame
    details={[
      {
        label: "file",
        value: data.node.definition.filepath,
      },
    ]}
    inputs={createGraphNodeInputs(
      Array.from(data.node.signature.inputTypes.keys()),
    )}
    title={`${data.node.displayName} (custom)`}
  />
);
