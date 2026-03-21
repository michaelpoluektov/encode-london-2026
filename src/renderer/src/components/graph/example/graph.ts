import defaultGraphDefinition from "../../../../../project-template/graph.json";
import { graphSchema } from "../internal/json-schema";

const exampleGraph = graphSchema.parse(defaultGraphDefinition);

export const EXAMPLE_GRAPH_SOURCE = JSON.stringify(exampleGraph, null, 2);
