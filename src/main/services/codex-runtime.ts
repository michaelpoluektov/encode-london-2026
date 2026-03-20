import { Codex } from "@openai/codex-sdk";
import {
  type CodexRuntimeState,
  codexRuntimeSchema,
} from "../../shared/contracts";

export const getCodexRuntimeState = (): CodexRuntimeState =>
  codexRuntimeSchema.parse({
    available: typeof Codex === "function",
    mode: "placeholder",
  });
