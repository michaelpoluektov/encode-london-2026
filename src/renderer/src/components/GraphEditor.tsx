import type { JSX } from "react";
import { editorFrame } from "../app-shell.css";
import { EXAMPLE_DAG_GRAPH } from "./graph/example";
import { Graph } from "./graph/Graph";

export const GraphEditor = (): JSX.Element => (
  <div className={editorFrame}>
    <Graph graph={EXAMPLE_DAG_GRAPH} />
  </div>
);
