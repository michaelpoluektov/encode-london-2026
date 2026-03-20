import type { JSX } from "react";
import { chatPanel, chatPanelInputStub, chatPanelWell } from "./chat-panel.css";
import { Stack } from "./ui/Stack";
import { Text } from "./ui/Text";
import { EmptyState, Well } from "./ui/Well";

export const ChatPanel = (): JSX.Element => (
  <section className={chatPanel}>
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
      <Text as="span" tone="muted" variant="caption">
        Prompt input will live here.
      </Text>
    </div>
  </section>
);
