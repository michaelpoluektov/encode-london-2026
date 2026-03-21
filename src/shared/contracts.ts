import { z } from "zod";

// Scaffold shortcut: this only describes placeholder runtime metadata for the
// shell and should be replaced once the Codex session lifecycle exists.
export const codexRuntimeSchema = z.object({
  available: z.boolean(),
  mode: z.literal("placeholder"),
});

export type CodexRuntimeState = z.infer<typeof codexRuntimeSchema>;

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

export type ProjectTreeNode = {
  path: string;
  name: string;
  kind: "file" | "directory";
  itemKind: "directory" | "editable" | "readOnly" | "image" | "binary";
  children?: ProjectTreeNode[];
};

export const projectTreeNodeSchema: z.ZodType<ProjectTreeNode> = z.lazy(() =>
  z.object({
    path: z.string().min(1),
    name: z.string().min(1),
    kind: z.enum(["file", "directory"]),
    itemKind: z.enum(["directory", "editable", "readOnly", "image", "binary"]),
    children: z.array(projectTreeNodeSchema).optional(),
  }),
);

export const projectOpenResultSchema = z.object({
  folderPath: z.string().min(1),
  manifest: shadilyManifestSchema,
  shaders: z.object({ fragment: z.string(), vertex: z.string() }),
  tree: z.array(projectTreeNodeSchema),
});

export type ProjectOpenResult = z.infer<typeof projectOpenResultSchema>;

export const bootstrapPayloadSchema = z.object({
  appName: z.string().min(1),
  platform: z.string().min(1),
  codex: codexRuntimeSchema,
  initialProject: projectOpenResultSchema.nullable(),
});

export type BootstrapPayload = z.infer<typeof bootstrapPayloadSchema>;

export const projectSavePayloadSchema = z.object({
  folderPath: z.string().min(1),
  manifest: shadilyManifestSchema,
  shaders: z.object({ fragment: z.string(), vertex: z.string() }),
});

export type ProjectSavePayload = z.infer<typeof projectSavePayloadSchema>;

export const projectEntryRequestSchema = z.object({
  folderPath: z.string().min(1),
  manifest: shadilyManifestSchema,
  path: z.string().min(1),
});

export type ProjectEntryRequest = z.infer<typeof projectEntryRequestSchema>;

export const projectTextEntryResultSchema = z.object({
  path: z.string().min(1),
  kind: z.literal("text"),
  language: z.string().min(1),
  isEditable: z.boolean(),
  content: z.string(),
});

export const projectBinaryEntryResultSchema = z.object({
  path: z.string().min(1),
  kind: z.literal("binary"),
  language: z.null(),
  isEditable: z.literal(false),
});

export const projectImageEntryResultSchema = z.object({
  path: z.string().min(1),
  kind: z.literal("image"),
  isEditable: z.literal(false),
  sourceUrl: z.string().min(1),
});

export const projectEntryResultSchema = z.discriminatedUnion("kind", [
  projectTextEntryResultSchema,
  projectImageEntryResultSchema,
  projectBinaryEntryResultSchema,
]);

export type ProjectTextEntryResult = z.infer<
  typeof projectTextEntryResultSchema
>;
export type ProjectImageEntryResult = z.infer<
  typeof projectImageEntryResultSchema
>;
export type ProjectBinaryEntryResult = z.infer<
  typeof projectBinaryEntryResultSchema
>;
export type ProjectEntryResult = z.infer<typeof projectEntryResultSchema>;

export const projectSaveCapturePayloadSchema = z.object({
  folderPath: z.string().min(1),
  dataUrl: z.string().startsWith("data:image/png;base64,"),
});

export type ProjectSaveCapturePayload = z.infer<
  typeof projectSaveCapturePayloadSchema
>;

export const projectSaveCaptureResultSchema = z.object({
  imagePath: z.string().min(1),
});

export type ProjectSaveCaptureResult = z.infer<
  typeof projectSaveCaptureResultSchema
>;

export const chatAttachPreviewContextPayloadSchema = z.object({
  imagePath: z.string().min(1),
});

export type ChatAttachPreviewContextPayload = z.infer<
  typeof chatAttachPreviewContextPayloadSchema
>;

export const chatAttachPreviewContextResultSchema = z.object({
  appliedChanges: z.boolean(),
  responseText: z.string(),
});

export type ChatAttachPreviewContextResult = z.infer<
  typeof chatAttachPreviewContextResultSchema
>;

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type FileChangeInfo = {
  path: string;
  kind: "add" | "delete" | "update";
};
