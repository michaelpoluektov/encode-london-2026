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
  readonly previewDataUrl?: string;
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
    preview={
      data.previewDataUrl !== undefined ? (
        <img
          alt="subgraph preview"
          src={data.previewDataUrl}
          style={{ borderRadius: 6, display: "block", width: "100%" }}
        />
      ) : undefined
    }
    title={`${data.node.displayName} (custom)`}
  />
);
