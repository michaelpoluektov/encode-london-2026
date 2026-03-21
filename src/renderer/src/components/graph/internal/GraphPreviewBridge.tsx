import { type JSX, useEffect } from "react";
import { useGraphPreviewStore } from "../../../store/graph-preview-store";
import { usePreviewStore } from "../../../store/preview-store";
import type { GraphUniformValues } from "../graph-types";
import type { CompileFragmentShaderResult } from "./compile-fragment-shader";

type GraphPreviewBridgeProps = {
  readonly compiledShader: CompileFragmentShaderResult | null;
  readonly errors: readonly string[];
  readonly uniformValues: GraphUniformValues;
};

export const GraphPreviewBridge = ({
  compiledShader,
  errors,
  uniformValues,
}: GraphPreviewBridgeProps): JSX.Element | null => {
  useEffect(() => {
    return () => {
      useGraphPreviewStore.getState().clearCompiledGraphShader();
    };
  }, []);

  useEffect(() => {
    if (compiledShader?.ok) {
      useGraphPreviewStore
        .getState()
        .setCompiledGraphShader(compiledShader.shaderSource, uniformValues);
      usePreviewStore.getState().clearFailureStage("compile");
      return;
    }

    useGraphPreviewStore.getState().clearCompiledGraphShader();

    if (errors.length > 0) {
      usePreviewStore.getState().markFailure({
        stage: "compile",
        message: errors.join("\n\n"),
        revision: null,
      });
      return;
    }

    if (compiledShader?.ok === false) {
      usePreviewStore.getState().markFailure({
        stage: "compile",
        message: compiledShader.errors.join("\n\n"),
        revision: null,
      });
      return;
    }

    usePreviewStore.getState().clearFailureStage("compile");
  }, [compiledShader, errors, uniformValues]);

  return null;
};
