import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  GraphSourceLoader,
  GraphUniformValue,
  GraphUniformValues,
  ValidatedGraph,
} from "../graph-types";
import { compileFragmentShader } from "./compile-fragment-shader";
import { cloneGlslValue, isGlslValueOfType } from "./glsl-type-registry";
import { readValidatedGraph } from "./load-and-validate-graph";

type UseGraphRuntimeOptions = {
  readonly graphSource: string;
  readonly loadCustomNodeSource?: GraphSourceLoader;
};

export type GraphRuntime = {
  readonly compiledShader: ReturnType<typeof compileFragmentShader> | null;
  readonly errors: readonly string[];
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
}: UseGraphRuntimeOptions): GraphRuntime => {
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [validatedGraph, setValidatedGraph] = useState<ValidatedGraph | null>(
    null,
  );
  const [uniformValues, setUniformValues] =
    useState<GraphUniformValues>(EMPTY_UNIFORM_VALUES);

  useEffect(() => {
    let cancelled = false;

    void readValidatedGraph(graphSource, { loadCustomNodeSource }).then(
      (result) => {
        if (cancelled) {
          return;
        }

        if (!result.ok) {
          setErrors(result.errors);
          setValidatedGraph(null);
          setUniformValues(EMPTY_UNIFORM_VALUES);
          return;
        }

        setErrors([]);
        setValidatedGraph(result.graph);
        setUniformValues(createInitialUniformValues(result.graph));
      },
    );

    return () => {
      cancelled = true;
    };
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

      setUniformValues((previousUniformValues) => ({
        ...previousUniformValues,
        [uniformBindingKey]: cloneGlslValue(value),
      }));
    },
    [validatedGraph],
  );

  return {
    compiledShader,
    errors,
    setUniformValue,
    uniformValues,
    validatedGraph,
  };
};
