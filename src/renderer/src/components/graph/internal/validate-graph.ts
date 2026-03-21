import type { DagGraph } from "../dag-schema";
import {
  type GraphParseIssue,
  type GraphParseOptions,
  parseGraph,
} from "./parse-graph";

export type GraphValidationIssue = GraphParseIssue;

export type GraphValidationResult = {
  readonly issues: readonly GraphValidationIssue[];
  readonly ok: boolean;
};
export type GraphSourceLoader = GraphParseOptions["loadCustomNodeSource"];
export type GraphValidationOptions = GraphParseOptions;

export const validateGraph = async (
  graph: DagGraph,
  options: GraphValidationOptions = {},
): Promise<GraphValidationResult> => {
  const result = await parseGraph(graph, options);

  return {
    issues: result.issues,
    ok: result.ok,
  };
};
