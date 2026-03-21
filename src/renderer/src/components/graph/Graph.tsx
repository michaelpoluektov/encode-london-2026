import type { JSX } from "react";
import type { GraphSourceLoader } from "./graph-types";
import { GraphCanvas } from "./internal/GraphCanvas";
import { GraphPreviewBridge } from "./internal/GraphPreviewBridge";
import { SubgraphMcpBridge } from "./internal/SubgraphMcpBridge";
import { useGraphRuntime } from "./internal/use-graph-runtime";

type GraphProps = {
  readonly className?: string;
  readonly graphSource: string;
  readonly loadCustomNodeSource?: GraphSourceLoader;
};

export const Graph = ({
  className,
  graphSource,
  loadCustomNodeSource,
}: GraphProps): JSX.Element => {
  const runtime = useGraphRuntime({
    graphSource,
    loadCustomNodeSource,
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
        errors={runtime.errors}
        setUniformValue={runtime.setUniformValue}
        uniformValues={runtime.uniformValues}
        validatedGraph={runtime.validatedGraph}
      />
    </>
  );
};
