import { type JSX, useEffect, useRef, useState } from "react";
import { Text } from "../../../ui/Text";
import type {
  GlslValueType,
  GraphUniformValue,
  ValidatedUniformEditor,
  Vec2Value,
  Vec3Value,
  Vec4Value,
} from "../../graph-types";
import { getGlslVectorComponentNames } from "../glsl-type-registry";
import {
  graphNodeCheckbox,
  graphNodeCheckboxRow,
  graphNodeColorInput,
  graphNodeNumberInput,
  graphNodeRangeInput,
  graphNodeRangeRow,
  graphNodeRangeValue,
  graphNodeVectorControls,
  graphNodeVectorLabel,
  graphNodeVectorRow,
} from "./graph-node.css";

type UniformGraphNodeControlsProps = {
  readonly editor: ValidatedUniformEditor;
  readonly instanceName: string;
  readonly onValueChange: (nextValue: GraphUniformValue) => void;
  readonly value: GraphUniformValue;
  readonly valueType: GlslValueType;
};

const clampColorChannel = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value * 255)));

const formatColorHex = (value: Vec4Value): string =>
  `#${[value.x, value.y, value.z]
    .map((channel) => clampColorChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const parseColorHex = (hexValue: string, alpha: number): Vec4Value | null => {
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
    w: alpha,
    x: Number.parseInt(colorMatch.groups.r, 16) / 255,
    y: Number.parseInt(colorMatch.groups.g, 16) / 255,
    z: Number.parseInt(colorMatch.groups.b, 16) / 255,
  };
};

const formatSliderValue = (valueType: GlslValueType, value: number): string =>
  valueType === "int" ? String(Math.round(value)) : value.toFixed(3);

const getSliderStep = (
  valueType: GlslValueType,
  min: number,
  max: number,
): number => {
  if (valueType === "int") {
    return 1;
  }

  const range = Math.abs(max - min);

  if (range === 0) {
    return 0.001;
  }

  return Number(Math.max(range / 1000, Number.EPSILON).toPrecision(3));
};

const readScalarInputValue = (
  rawValue: string,
  fallbackValue: number,
  valueType: GlslValueType,
): number => {
  if (rawValue.trim() === "") {
    return fallbackValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return fallbackValue;
  }

  return valueType === "int" ? Math.round(parsedValue) : parsedValue;
};

const SLIDER_DEBOUNCE_MS = 150;

const SliderControl = ({
  instanceName,
  max,
  min,
  onValueChange,
  value,
  valueType,
}: {
  readonly instanceName: string;
  readonly max: number;
  readonly min: number;
  readonly onValueChange: (nextValue: number) => void;
  readonly value: number;
  readonly valueType: GlslValueType;
}): JSX.Element => {
  const [draftValue, setDraftValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <div className={`${graphNodeRangeRow} nopan`}>
      <input
        aria-label={`${instanceName} value`}
        className={`${graphNodeRangeInput} nodrag nowheel nopan`}
        max={max}
        min={min}
        onInput={(event) => {
          const nextValue = event.currentTarget.valueAsNumber;

          if (!Number.isFinite(nextValue)) {
            return;
          }

          const normalizedValue =
            valueType === "int" ? Math.round(nextValue) : nextValue;

          setDraftValue(normalizedValue);

          if (debounceRef.current !== null) {
            clearTimeout(debounceRef.current);
          }
          debounceRef.current = setTimeout(() => {
            onValueChange(normalizedValue);
          }, SLIDER_DEBOUNCE_MS);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        step={getSliderStep(valueType, min, max)}
        type="range"
        value={draftValue}
      />
      <Text
        as="span"
        className={graphNodeRangeValue}
        tone="secondary"
        variant="code"
      >
        {formatSliderValue(valueType, draftValue)}
      </Text>
    </div>
  );
};

const NumberControl = ({
  instanceName,
  onValueChange,
  value,
  valueType,
}: {
  readonly instanceName: string;
  readonly onValueChange: (nextValue: number) => void;
  readonly value: number;
  readonly valueType: GlslValueType;
}): JSX.Element => (
  <input
    aria-label={`${instanceName} value`}
    className={`${graphNodeNumberInput} nodrag nowheel nopan`}
    inputMode={valueType === "int" ? "numeric" : "decimal"}
    onChange={(event) => {
      onValueChange(
        readScalarInputValue(event.currentTarget.value, value, valueType),
      );
    }}
    onPointerDown={(event) => {
      event.stopPropagation();
    }}
    step={valueType === "int" ? 1 : "any"}
    type="number"
    value={value}
  />
);

const CheckboxControl = ({
  instanceName,
  onValueChange,
  value,
}: {
  readonly instanceName: string;
  readonly onValueChange: (nextValue: boolean) => void;
  readonly value: boolean;
}): JSX.Element => (
  <label className={`${graphNodeCheckboxRow} nopan`}>
    <input
      aria-label={`${instanceName} value`}
      checked={value}
      className={`${graphNodeCheckbox} nodrag nowheel nopan`}
      onChange={(event) => {
        onValueChange(event.currentTarget.checked);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      type="checkbox"
    />
    <Text as="span" tone="secondary" variant="code">
      {value ? "true" : "false"}
    </Text>
  </label>
);

const VectorControl = ({
  instanceName,
  onValueChange,
  value,
  valueType,
}: {
  readonly instanceName: string;
  readonly onValueChange: (
    nextValue: Vec2Value | Vec3Value | Vec4Value,
  ) => void;
  readonly value: Vec2Value | Vec3Value | Vec4Value;
  readonly valueType: GlslValueType;
}): JSX.Element => {
  const componentNames = getGlslVectorComponentNames(valueType);

  return (
    <div className={graphNodeVectorControls}>
      {componentNames.map((componentName) => (
        <label className={`${graphNodeVectorRow} nopan`} key={componentName}>
          <Text
            as="span"
            className={graphNodeVectorLabel}
            tone="muted"
            variant="label"
          >
            {componentName}
          </Text>
          <input
            aria-label={`${instanceName} ${componentName}`}
            className={`${graphNodeNumberInput} nodrag nowheel nopan`}
            inputMode="decimal"
            onChange={(event) => {
              onValueChange({
                ...value,
                [componentName]: readScalarInputValue(
                  event.currentTarget.value,
                  value[componentName as keyof typeof value],
                  "float",
                ),
              });
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            step="any"
            type="number"
            value={value[componentName as keyof typeof value]}
          />
        </label>
      ))}
    </div>
  );
};

const ColorControl = ({
  instanceName,
  onValueChange,
  value,
}: {
  readonly instanceName: string;
  readonly onValueChange: (nextValue: Vec4Value) => void;
  readonly value: Vec4Value;
}): JSX.Element => {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draftHex, setDraftHex] = useState(formatColorHex(value));

  useEffect(() => {
    setDraftHex(formatColorHex(value));
  }, [value]);

  const handleColor = (hexValue: string): void => {
    setDraftHex(hexValue);
    const nextValue = parseColorHex(hexValue, value.w);
    if (nextValue === null) return;
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onValueChange(nextValue);
    }, SLIDER_DEBOUNCE_MS);
  };

  return (
    <input
      aria-label={`${instanceName} color`}
      className={`${graphNodeColorInput} nodrag nowheel nopan`}
      onChange={(event) => {
        handleColor(event.currentTarget.value);
      }}
      onInput={(event) => {
        handleColor(event.currentTarget.value);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      type="color"
      value={draftHex}
    />
  );
};

export const UniformGraphNodeControls = ({
  editor,
  instanceName,
  onValueChange,
  value,
  valueType,
}: UniformGraphNodeControlsProps): JSX.Element | null => {
  switch (editor.kind) {
    case "checkbox":
      return typeof value === "boolean" ? (
        <CheckboxControl
          instanceName={instanceName}
          onValueChange={onValueChange}
          value={value}
        />
      ) : null;
    case "color":
      return typeof value === "object" && value !== null && "w" in value ? (
        <ColorControl
          instanceName={instanceName}
          onValueChange={onValueChange}
          value={value}
        />
      ) : null;
    case "number":
      return typeof value === "number" ? (
        <NumberControl
          instanceName={instanceName}
          onValueChange={onValueChange}
          value={value}
          valueType={valueType}
        />
      ) : null;
    case "slider":
      return typeof value === "number" ? (
        <SliderControl
          instanceName={instanceName}
          max={editor.max}
          min={editor.min}
          onValueChange={onValueChange}
          value={value}
          valueType={valueType}
        />
      ) : null;
    case "vector":
      return typeof value === "object" && value !== null ? (
        <VectorControl
          instanceName={instanceName}
          onValueChange={onValueChange}
          value={value}
          valueType={valueType}
        />
      ) : null;
  }
};
