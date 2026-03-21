import { type JSX, useEffect, useState } from "react";
import { Text } from "../../../ui/Text";
import {
  type GraphFlowNode,
  type GraphFlowNodeProps,
  type GraphNodeDetail,
  GraphNodeFrame,
} from "./GraphNode";
import {
  graphNodeNumberInput,
  graphNodeRangeInput,
  graphNodeRangeRow,
  graphNodeRangeValue,
} from "./graph-node.css";
import type { FloatGraphNodeData } from "./node-data";

export type FloatGraphFlowNode = GraphFlowNode<FloatGraphNodeData, "float">;

const formatSliderValue = (value: number): string => value.toFixed(3);

const getSliderStep = (min: number, max: number): number => {
  const range = Math.abs(max - min);

  if (range === 0) {
    return 0.001;
  }

  return Number(Math.max(range / 1000, Number.EPSILON).toPrecision(3));
};

const readNumberInputValue = (
  rawValue: string,
  fallbackValue: number,
): number => {
  if (rawValue.trim() === "") {
    return fallbackValue;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
};

export const FloatGraphNode = ({
  data,
}: GraphFlowNodeProps<FloatGraphNodeData, "float">): JSX.Element => {
  const [draftValue, setDraftValue] = useState(data.value);

  useEffect(() => {
    setDraftValue(data.value);
  }, [data.value]);

  const details: GraphNodeDetail[] = [
    {
      label: "uniform",
      value: data.definition.uniformName,
    },
  ];

  const hasSlider =
    data.definition.min !== undefined && data.definition.max !== undefined;

  const sliderStep = hasSlider
    ? getSliderStep(data.definition.min ?? 0, data.definition.max ?? 0)
    : undefined;

  return (
    <GraphNodeFrame
      controls={
        hasSlider ? (
          <div className={`${graphNodeRangeRow} nopan`}>
            <input
              aria-label={`${data.definition.instanceName} value`}
              className={`${graphNodeRangeInput} nodrag nowheel nopan`}
              max={data.definition.max}
              min={data.definition.min}
              onInput={(event) => {
                const nextValue = event.currentTarget.valueAsNumber;

                if (Number.isFinite(nextValue)) {
                  setDraftValue(nextValue);
                  data.onValueChange(nextValue);
                }
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              step={sliderStep}
              type="range"
              value={draftValue}
            />
            <Text
              as="span"
              className={graphNodeRangeValue}
              tone="secondary"
              variant="code"
            >
              {formatSliderValue(draftValue)}
            </Text>
          </div>
        ) : (
          <input
            aria-label={`${data.definition.instanceName} value`}
            className={`${graphNodeNumberInput} nodrag nowheel nopan`}
            inputMode="decimal"
            max={data.definition.max}
            min={data.definition.min}
            onChange={(event) => {
              data.onValueChange(
                readNumberInputValue(event.currentTarget.value, data.value),
              );
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            step="any"
            type="number"
            value={data.value}
          />
        )
      }
      details={details}
      title={data.definition.instanceName}
    />
  );
};
