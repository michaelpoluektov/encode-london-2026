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

export const shadilyManifestSchema = z.object({
  name: z.string(),
  version: z.literal("1"),
  shaders: z.object({ fragment: z.string(), vertex: z.string() }),
  preview: z.object({ mesh: z.string() }),
  created: z.string(),
  modified: z.string(),
});

export type ShadilyManifest = z.infer<typeof shadilyManifestSchema>;

export const recentProjectSchema = z.object({
  name: z.string(),
  path: z.string(),
});

export type RecentProject = z.infer<typeof recentProjectSchema>;

export const appConfigSchema = z.object({
  recentProjects: z.array(recentProjectSchema),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export type ProjectOpenResult = {
  folderPath: string;
  manifest: ShadilyManifest;
  shaders: { fragment: string; vertex: string };
};

export type ProjectSavePayload = {
  folderPath: string;
  manifest: ShadilyManifest;
  shaders: { fragment: string; vertex: string };
};
