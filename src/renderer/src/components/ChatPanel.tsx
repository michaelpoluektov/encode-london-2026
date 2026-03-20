import type { JSX } from "react";
import {
  chatPanel,
  chatPanelCopy,
  chatPanelEmptyState,
  chatPanelInputStub,
  chatPanelIntro,
  chatPanelLabel,
  chatPanelWell,
} from "./chat-panel.css";

export const ChatPanel = (): JSX.Element => (
  <section className={chatPanel}>
    <p className={chatPanelIntro}>
      This region is reserved for the agent chat, tool output, and follow-up
      controls.
    </p>
    <div className={chatPanelEmptyState}>
      <div className={chatPanelWell}>
        <span className={chatPanelLabel}>Chat Placeholder</span>
        <p className={chatPanelCopy}>
          No chat session is mounted yet. Keep this panel light until the real
          runtime, history, and attachment flow exist.
        </p>
      </div>
    </div>
    <div className={chatPanelInputStub}>Prompt input will live here.</div>
  </section>
);
