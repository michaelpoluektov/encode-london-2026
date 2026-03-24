import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GraphSourceLoader,
  GraphUniformValue,
  GraphUniformValues,
  ValidatedGraph,
} from "../graph-types";
import { compileFragmentShader } from "./compile-fragment-shader";
import { cloneGlslValue, isGlslValueOfType } from "./glsl-type-registry";
import { readValidatedGraph } from "./load-and-validate-graph";

export const applyUniformValuesToGraphSource = (
  graphSource: string,
  uniformValues: GraphUniformValues,
): string => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(graphSource);
  } catch {
    return graphSource;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { nodes?: unknown }).nodes)
  ) {
    return graphSource;
  }

  const nodes = (parsed as { nodes: unknown[] }).nodes.map((node) => {
    if (
      typeof node !== "object" ||
      node === null ||
      (node as { kind?: unknown }).kind !== "uniform"
    ) {
      return node;
    }

    const uniformNode = node as { uniformName: string; [key: string]: unknown };
    const value = uniformValues[uniformNode.uniformName];

    if (value === undefined) {
      return node;
    }

    return { ...uniformNode, defaultValue: value };
  });

  return JSON.stringify({ ...(parsed as object), nodes }, null, 2);
};

type UseGraphRuntimeOptions = {
  readonly graphSource: string;
  readonly loadCustomNodeSource?: GraphSourceLoader;
  readonly onUniformValuesChange?: (uniformValues: GraphUniformValues) => void;
};

export type GraphRuntime = {
  readonly compiledShader: ReturnType<typeof compileFragmentShader> | null;
  readonly errors: readonly string[];
  readonly isStale: boolean;
  readonly setUniformValue: (
    uniformBindingKey: string,
    value: GraphUniformValue,
  ) => void;
  readonly uniformValues: GraphUniformValues;
  readonly validatedGraph: ValidatedGraph | null;
};

const EMPTY_UNIFORM_VALUES: GraphUniformValues = Object.freeze({});

const createInitialUniformValues = (
  graph: ValidatedGraph,
): GraphUniformValues =>
  Object.fromEntries(
    graph.uniforms.map((uniform) => [
      uniform.key,
      cloneGlslValue(uniform.defaultValue),
    ]),
  );

export const useGraphRuntime = ({
  graphSource,
  loadCustomNodeSource,
  onUniformValuesChange,
}: UseGraphRuntimeOptions): GraphRuntime => {
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [isStale, setIsStale] = useState(false);
  const [validatedGraph, setValidatedGraph] = useState<ValidatedGraph | null>(
    null,
  );
  const [uniformValues, setUniformValues] =
    useState<GraphUniformValues>(EMPTY_UNIFORM_VALUES);
  const requestVersionRef = useRef(0);
  const uniformValuesRef = useRef<GraphUniformValues>(uniformValues);
  const validatedGraphRef = useRef<ValidatedGraph | null>(validatedGraph);

  useEffect(() => {
    validatedGraphRef.current = validatedGraph;
  }, [validatedGraph]);

  useEffect(() => {
    uniformValuesRef.current = uniformValues;
  }, [uniformValues]);

  useEffect(() => {
    requestVersionRef.current += 1;
    const requestVersion = requestVersionRef.current;

    const loadRuntime = async (): Promise<void> => {
      try {
        const result = await readValidatedGraph(graphSource, {
          loadCustomNodeSource,
        });

        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        if (!result.ok) {
          setErrors(result.errors);
          setIsStale(validatedGraphRef.current !== null);

          if (validatedGraphRef.current === null) {
            setUniformValues(EMPTY_UNIFORM_VALUES);
          }

          return;
        }

        setErrors([]);
        setIsStale(false);
        setValidatedGraph(result.graph);
        setUniformValues(createInitialUniformValues(result.graph));
      } catch (error) {
        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unknown error.";

        console.error("[graph-runtime] Failed to validate graph:", error);
        setErrors([`Graph validation crashed unexpectedly. ${message}`]);
        setIsStale(validatedGraphRef.current !== null);

        if (validatedGraphRef.current === null) {
          setUniformValues(EMPTY_UNIFORM_VALUES);
        }
      }
    };

    void loadRuntime();
  }, [graphSource, loadCustomNodeSource]);

  const compiledShader = useMemo(
    () =>
      validatedGraph === null ? null : compileFragmentShader(validatedGraph),
    [validatedGraph],
  );

  const setUniformValue = useCallback(
    (uniformBindingKey: string, value: GraphUniformValue) => {
      if (validatedGraph === null) {
        return;
      }

      const binding = validatedGraph.uniforms.find(
        (candidate) => candidate.key === uniformBindingKey,
      );

      if (
        binding === undefined ||
        !isGlslValueOfType(binding.valueType, value)
      ) {
        return;
      }

      const clonedValue = cloneGlslValue(value);
      const nextValues = {
        ...uniformValuesRef.current,
        [uniformBindingKey]: clonedValue,
      };

      setUniformValues(nextValues);
      onUniformValuesChange?.(nextValues);
    },
    [validatedGraph, onUniformValuesChange],
  );

  return {
    compiledShader,
    errors,
    isStale,
    setUniformValue,
    uniformValues,
    validatedGraph,
  };
};
