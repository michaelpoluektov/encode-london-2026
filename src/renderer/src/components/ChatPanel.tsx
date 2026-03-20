import type { JSX } from "react";
import {
  chatPanel,
  chatPanelInputStub,
  chatPanelIntro,
  chatPanelWell,
} from "./chat-panel.css";
import { Stack } from "./ui/Stack";
import { Text } from "./ui/Text";
import { EmptyState, Well } from "./ui/Well";

export const ChatPanel = (): JSX.Element => (
  <section className={chatPanel}>
    <Text as="p" className={chatPanelIntro} tone="secondary" variant="body">
      This region is reserved for the agent chat, tool output, and follow-up
      controls.
    </Text>
    <EmptyState>
      <Well className={chatPanelWell}>
        <Stack gap={3}>
          <Text as="span" variant="label">
            Chat Placeholder
          </Text>
          <Text as="p" tone="secondary" variant="body">
            No chat session is mounted yet. Keep this panel light until the real
            runtime, history, and attachment flow exist.
          </Text>
        </Stack>
      </Well>
    </EmptyState>
    <div className={chatPanelInputStub}>
      <Text as="span" tone="muted" variant="code">
        Prompt input will live here.
      </Text>
    </div>
  </section>
);
