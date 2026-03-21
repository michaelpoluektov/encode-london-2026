import type { JSX } from "react";
import type {
  GraphUniformValue,
  ValidatedUniformNode,
} from "../../graph-types";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  type GraphNodeDetail,
  GraphNodeFrame,
} from "./GraphNode";
import { UniformGraphNodeControls } from "./UniformGraphNodeControls";

export type UniformGraphNodeData = {
  readonly node: ValidatedUniformNode;
  readonly onValueChange: (nextValue: GraphUniformValue) => void;
  readonly value: GraphUniformValue;
};

export type UniformGraphFlowNode = GraphFlowNode<
  UniformGraphNodeData,
  "uniform"
>;

export const UniformGraphNode = ({
  data,
}: GraphFlowNodeProps<UniformGraphNodeData, "uniform">): JSX.Element => {
  const details: GraphNodeDetail[] = [
    {
      label: "uniform",
      value: data.node.uniformBindingKey,
    },
  ];

  return (
    <GraphNodeFrame
      controls={
        <UniformGraphNodeControls
          editor={data.node.editor}
          instanceName={data.node.displayName}
          onValueChange={data.onValueChange}
          value={data.value}
          valueType={data.node.outputType}
        />
      }
      details={details}
      title={`${data.node.displayName} (${data.node.outputType})`}
    />
  );
};
