import { z } from "zod";

// Scaffold shortcut: this only describes placeholder runtime metadata for the
// shell and should be replaced once the Codex session lifecycle exists.
export const codexRuntimeSchema = z.object({
  available: z.boolean(),
  mode: z.literal("placeholder"),
});

export type CodexRuntimeState = z.infer<typeof codexRuntimeSchema>;

export const bootstrapPayloadSchema = z.object({
  appName: z.string().min(1),
  platform: z.string().min(1),
  codex: codexRuntimeSchema,
});

export type BootstrapPayload = z.infer<typeof bootstrapPayloadSchema>;
