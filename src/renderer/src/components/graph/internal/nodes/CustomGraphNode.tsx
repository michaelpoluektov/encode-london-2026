import type { JSX } from "react";
import type { ValidatedCustomNode } from "../../graph-types";
import {
  createGraphNodeInputs,
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";
import {
  graphNodePreviewImage,
  graphNodePreviewPlaceholder,
  graphNodePreviewSurface,
} from "./graph-node.css";

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
      <div className={graphNodePreviewSurface}>
        {data.previewDataUrl !== undefined ? (
          <img
            alt="subgraph preview"
            className={graphNodePreviewImage}
            src={data.previewDataUrl}
          />
        ) : (
          <div className={graphNodePreviewPlaceholder}>Rendering preview</div>
        )}
      </div>
    }
    title={`${data.node.displayName} (custom)`}
  />
);
