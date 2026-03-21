import type { JSX } from "react";
import type {
  ValidatedTimeNode,
  ValidatedVaryingNode,
} from "../../graph-types";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";

type SourceGraphNodeData = {
  readonly detailLabel: string;
  readonly detailValue: string;
  readonly node: ValidatedTimeNode | ValidatedVaryingNode;
};

const renderSourceGraphNode = ({
  data,
}: {
  readonly data: SourceGraphNodeData;
}): JSX.Element => (
  <GraphNodeFrame
    details={[
      {
        label: data.detailLabel,
        value: data.detailValue,
      },
    ]}
    title={`${data.node.displayName} (${data.node.outputType})`}
  />
);

export type TimeGraphNodeData = {
  readonly node: ValidatedTimeNode;
};

export type TimeGraphFlowNode = GraphFlowNode<TimeGraphNodeData, "time">;

export const TimeGraphNode = ({
  data,
}: GraphFlowNodeProps<TimeGraphNodeData, "time">): JSX.Element =>
  renderSourceGraphNode({
    data: {
      detailLabel: "uniform",
      detailValue: data.node.timeBindingKey,
      node: data.node,
    },
  });

export type VaryingGraphNodeData = {
  readonly node: ValidatedVaryingNode;
};

export type VaryingGraphFlowNode = GraphFlowNode<
  VaryingGraphNodeData,
  "varying"
>;

export const VaryingGraphNode = ({
  data,
}: GraphFlowNodeProps<VaryingGraphNodeData, "varying">): JSX.Element =>
  renderSourceGraphNode({
    data: {
      detailLabel: "varying",
      detailValue: data.node.varyingBindingKey,
      node: data.node,
    },
  });
