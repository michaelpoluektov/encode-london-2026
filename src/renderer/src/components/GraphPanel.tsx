import type { JSX } from "react";
import {
  graphBadge,
  graphBadgeRow,
  graphFeatureList,
  graphPanel,
  graphSection,
  graphSectionTitle,
} from "./graph-panel.css";
import { Stack } from "./ui/Stack";
import { Text } from "./ui/Text";
import { Well } from "./ui/Well";

const plannedFeatures = [
  "Node canvas for shader structure and data flow",
  "Bidirectional sync between source edits and graph state",
  "AI operations that can inspect and modify graph nodes",
] as const;

const currentSignals = ["Wired into layout", "Toggleable", "Moveable"] as const;

export const GraphPanel = (): JSX.Element => (
  <section className={graphPanel}>
    <Well tone="accent">
      <Stack gap={2}>
        <Text as="p" tone="muted" variant="caption">
          Graph workspace
        </Text>
        <Text as="p" variant="body">
          This panel is the reserved home for the additive graph editor
          described in the project architecture. It is connected to the main
          workspace now so we can build into it incrementally.
        </Text>
        <div className={graphBadgeRow}>
          {currentSignals.map((signal) => (
            <Text
              key={signal}
              as="span"
              className={graphBadge}
              variant="caption"
            >
              {signal}
            </Text>
          ))}
        </div>
      </Stack>
    </Well>

    <Well>
      <section className={graphSection}>
        <Text
          as="strong"
          className={graphSectionTitle}
          tone="muted"
          variant="caption"
        >
          Planned direction
        </Text>
        <ul className={graphFeatureList}>
          {plannedFeatures.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
    </Well>
  </section>
);
