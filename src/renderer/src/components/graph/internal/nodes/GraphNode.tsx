import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import type { JSX, ReactNode } from "react";
import { Text } from "../../../ui/Text";
import {
  graphNodeCard,
  graphNodeDetailRow,
  graphNodeDetails,
  graphNodeHeader,
  graphNodeInputHandle,
  graphNodeInputRow,
  graphNodeInputs,
  graphNodeOutputHandle,
  graphNodePreviewSlot,
  graphNodeRoot,
} from "./graph-node.css";

export type GraphNodeInput = {
  readonly id: string;
  readonly label: string;
};

export type GraphNodeDetail = {
  readonly label: string;
  readonly value: string;
  readonly valueVariant?: "body" | "caption" | "code" | "label" | "title";
};

export type GraphNodeFrameProps = {
  readonly details?: readonly GraphNodeDetail[];
  readonly hasOutput?: boolean;
  readonly inputs?: readonly GraphNodeInput[];
  readonly preview?: ReactNode;
  readonly title: string;
};

export const GRAPH_NODE_OUTPUT_HANDLE_ID = "output";

export const createGraphNodeInputs = (
  inputNames: readonly string[],
): GraphNodeInput[] =>
  inputNames.map((inputName) => ({
    id: inputName,
    label: inputName,
  }));

export const GraphNodeFrame = ({
  details = [],
  hasOutput = true,
  inputs = [],
  preview,
  title,
}: GraphNodeFrameProps): JSX.Element => (
  <div className={graphNodeRoot}>
    <div className={graphNodeCard}>
      <div className={graphNodeHeader}>
        <Text as="div" tone="default" variant="title">
          {title}
        </Text>
      </div>

      {inputs.length > 0 ? (
        <div className={graphNodeInputs}>
          {inputs.map((input) => (
            <div className={graphNodeInputRow} key={input.id}>
              <Handle
                className={graphNodeInputHandle}
                id={input.id}
                isConnectable={false}
                position={Position.Left}
                type="target"
              />
              <Text as="span" variant="code">
                {input.label}
              </Text>
            </div>
          ))}
        </div>
      ) : null}

      {details.length > 0 ? (
        <div className={graphNodeDetails}>
          {details.map((detail) => (
            <div className={graphNodeDetailRow} key={detail.label}>
              <Text as="span" tone="muted" variant="label">
                {detail.label}
              </Text>
              <Text
                as="span"
                tone="secondary"
                variant={detail.valueVariant ?? "code"}
              >
                {detail.value}
              </Text>
            </div>
          ))}
        </div>
      ) : null}

      {hasOutput ? (
        <Handle
          className={graphNodeOutputHandle}
          id={GRAPH_NODE_OUTPUT_HANDLE_ID}
          isConnectable={false}
          position={Position.Right}
          type="source"
        />
      ) : null}
    </div>

    {preview ? <div className={graphNodePreviewSlot}>{preview}</div> : null}
  </div>
);

export type GraphFlowNode<
  Data extends Record<string, unknown>,
  Kind extends string,
> = Node<Data, Kind>;

export type GraphFlowNodeProps<
  Data extends Record<string, unknown>,
  Kind extends string,
> = NodeProps<GraphFlowNode<Data, Kind>>;
