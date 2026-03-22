import type { JSX, ReactNode } from "react";
import type { GraphSourceLoader, GraphUniformValues } from "./graph-types";
import { GraphCanvas } from "./internal/GraphCanvas";
import { GraphPreviewBridge } from "./internal/GraphPreviewBridge";
import { SubgraphMcpBridge } from "./internal/SubgraphMcpBridge";
import { useGraphRuntime } from "./internal/use-graph-runtime";

type GraphProps = {
  readonly className?: string;
  readonly controls?: ReactNode;
  readonly graphSource: string;
  readonly loadCustomNodeSource?: GraphSourceLoader;
  readonly onUniformValuesChange?: (uniformValues: GraphUniformValues) => void;
};

export const Graph = ({
  className,
  controls = null,
  graphSource,
  loadCustomNodeSource,
  onUniformValuesChange,
}: GraphProps): JSX.Element => {
  const runtime = useGraphRuntime({
    graphSource,
    loadCustomNodeSource,
    onUniformValuesChange,
  });

  return (
    <>
      <GraphPreviewBridge
        compiledShader={runtime.compiledShader}
        errors={runtime.errors}
        uniformValues={runtime.uniformValues}
      />
      <SubgraphMcpBridge
        uniformValues={runtime.uniformValues}
        validatedGraph={runtime.validatedGraph}
      />
      <GraphCanvas
        className={className}
        controls={controls}
        errors={runtime.errors}
        isStale={runtime.isStale}
        setUniformValue={runtime.setUniformValue}
        uniformValues={runtime.uniformValues}
        validatedGraph={runtime.validatedGraph}
      />
    </>
  );
};
