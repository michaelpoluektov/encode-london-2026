import type { JSX } from "react";
import { graphPanel, graphPlaceholder } from "./graph-panel.css";
import { Text } from "./ui/Text";

export const GraphPanel = (): JSX.Element => (
  <section className={graphPanel}>
    <Text as="p" className={graphPlaceholder} tone="muted" variant="caption">
      [...]
    </Text>
  </section>
);
