import type { JSX } from "react";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  GraphNodeFrame,
} from "./GraphNode";
import { graphNodeColorInput } from "./graph-node.css";
import type { ColorGraphNodeData } from "./node-data";

export type ColorGraphFlowNode = GraphFlowNode<ColorGraphNodeData, "color">;

const clampColorChannel = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value * 255)));

const formatColorHex = ({ b, g, r }: ColorGraphNodeData["value"]): string =>
  `#${[r, g, b]
    .map((channel) => clampColorChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const parseColorHex = (
  hexValue: string,
  alpha: number,
): ColorGraphNodeData["value"] | null => {
  const colorMatch = hexValue.match(
    /^#(?<r>[0-9a-fA-F]{2})(?<g>[0-9a-fA-F]{2})(?<b>[0-9a-fA-F]{2})$/,
  );

  if (
    colorMatch?.groups?.r === undefined ||
    colorMatch.groups.g === undefined ||
    colorMatch.groups.b === undefined
  ) {
    return null;
  }

  return {
    a: alpha,
    b: Number.parseInt(colorMatch.groups.b, 16) / 255,
    g: Number.parseInt(colorMatch.groups.g, 16) / 255,
    r: Number.parseInt(colorMatch.groups.r, 16) / 255,
  };
};

export const ColorGraphNode = ({
  data,
}: GraphFlowNodeProps<ColorGraphNodeData, "color">): JSX.Element => {
  const applyColorValue = (rawValue: string): void => {
    const nextValue = parseColorHex(rawValue, data.value.a);

    if (nextValue !== null) {
      data.onValueChange(nextValue);
    }
  };

  return (
    <GraphNodeFrame
      controls={
        <input
          aria-label={`${data.definition.instanceName} color`}
          className={`${graphNodeColorInput} nodrag nowheel nopan`}
          onChange={(event) => {
            applyColorValue(event.currentTarget.value);
          }}
          onInput={(event) => {
            applyColorValue(event.currentTarget.value);
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          type="color"
          value={formatColorHex(data.value)}
        />
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
};
