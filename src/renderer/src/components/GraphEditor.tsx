import type { JSX } from "react";
import { editorFrame } from "../app-shell.css";
import { EXAMPLE_GRAPH_SOURCE } from "./graph/example";
import { Graph } from "./graph/Graph";

export const GraphEditor = (): JSX.Element => (
  <div className={editorFrame}>
    <Graph graphSource={EXAMPLE_GRAPH_SOURCE} />
  </div>
);
