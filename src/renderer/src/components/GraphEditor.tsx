import type { JSX } from "react";
import { editorFrame } from "../app-shell.css";
import { Graph } from "./graph/Graph";
import { EXAMPLE_DAG_GRAPH } from "./graph-example";

export const GraphEditor = (): JSX.Element => (
  <div className={editorFrame}>
    <Graph graph={EXAMPLE_DAG_GRAPH} />
  </div>
);
