import type { DagGraph } from "../dag-schema";
import {
  type GraphParseOptions,
  type ParsedDagGraph,
  parseGraphOrThrow,
} from "./parse-graph";

export type CompileShaderOptions = GraphParseOptions;

export const prepareGraphForCompilation = async (
  graph: DagGraph,
  options: CompileShaderOptions = {},
): Promise<ParsedDagGraph> => parseGraphOrThrow(graph, options);
