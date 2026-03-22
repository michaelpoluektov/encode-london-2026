import type { JSX } from "react";
import {
  EMPTY_SUBGRAPH_PREVIEW_ENTRY,
  useSubgraphPreviewStore,
} from "../../../../store/subgraph-preview-store";
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
};

export type CustomGraphFlowNode = GraphFlowNode<CustomGraphNodeData, "custom">;

export const CustomGraphNode = ({
  data,
}: GraphFlowNodeProps<CustomGraphNodeData, "custom">): JSX.Element => {
  const previewEntry = useSubgraphPreviewStore(
    (state) => state.byNodeId[data.node.flowId] ?? EMPTY_SUBGRAPH_PREVIEW_ENTRY,
  );
  const placeholderLabel =
    previewEntry.status === "error" && previewEntry.imageUrl === null
      ? "Preview unavailable"
      : previewEntry.status === "idle"
        ? "Preparing preview"
        : "Rendering preview";

  return (
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
          {previewEntry.imageUrl !== null ? (
            <img
              alt="subgraph preview"
              className={graphNodePreviewImage}
              src={previewEntry.imageUrl}
            />
          ) : (
            <div className={graphNodePreviewPlaceholder}>
              {placeholderLabel}
            </div>
          )}
        </div>
      }
      title={`${data.node.displayName} (custom)`}
    />
  );
};
