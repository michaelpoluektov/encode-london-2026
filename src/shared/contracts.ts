import { z } from "zod";

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
