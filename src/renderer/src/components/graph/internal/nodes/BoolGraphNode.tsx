import type { JSX } from "react";
import { Text } from "../../../ui/Text";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";
import { graphNodeCheckbox, graphNodeCheckboxRow } from "./graph-node.css";
import type { BoolGraphNodeData } from "./node-data";

export type BoolGraphFlowNode = GraphFlowNode<BoolGraphNodeData, "bool">;

export const BoolGraphNode = ({
  data,
}: GraphFlowNodeProps<BoolGraphNodeData, "bool">): JSX.Element => (
  <GraphNodeFrame
    controls={
      <label className={`${graphNodeCheckboxRow} nopan`}>
        <input
          aria-label={`${data.definition.instanceName} value`}
          checked={data.value}
          className={`${graphNodeCheckbox} nodrag nowheel nopan`}
          onChange={(event) => {
            data.onValueChange(event.currentTarget.checked);
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          type="checkbox"
        />
        <Text as="span" tone="secondary" variant="code">
          {data.value ? "true" : "false"}
        </Text>
      </label>
    }
    details={[
      {
        label: "uniform",
        value: data.definition.uniformName,
      },
    ]}
    title={data.definition.instanceName}
  />
);
