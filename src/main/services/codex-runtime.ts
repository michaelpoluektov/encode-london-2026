import { Codex } from "@openai/codex-sdk";
import {
  type CodexRuntimeState,
  codexRuntimeSchema,
} from "../../shared/contracts";

// Scaffold shortcut: importing the SDK proves the package is bundled, not that
// a real Codex runtime session can be started successfully.
export const getCodexRuntimeState = (): CodexRuntimeState =>
  codexRuntimeSchema.parse({
    available: typeof Codex === "function",
    mode: "placeholder",
  });
