import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { JSX } from "react";
import type { DagGraph } from "../../dag/dag-schema";
import { cx } from "../../lib/cx";
import { graphCanvas } from "./graph.css";
import {
  createFlowElements,
  dagNodeTypes,
} from "./internal/create-flow-elements";

type GraphProps = {
  readonly className?: string;
  readonly graph: DagGraph;
};

export const Graph = ({ className, graph }: GraphProps): JSX.Element => {
  const { edges, nodes } = createFlowElements(graph);

  return (
    <div className={cx(graphCanvas, className)}>
      <ReactFlow
        edges={edges}
        elementsSelectable={false}
        fitView
        nodes={nodes}
        nodeTypes={dagNodeTypes}
        nodesConnectable={false}
        nodesDraggable={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
};
