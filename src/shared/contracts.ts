import { z } from "zod";

export const codexRuntimeSchema = z.object({
  available: z.boolean(),
  mode: z.literal("placeholder"),
});

export type CodexRuntimeState = z.infer<typeof codexRuntimeSchema>;

export const shadilyManifestSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string(),
  version: z.literal("2"),
  graph: z.object({ source: z.string() }),
  preview: z.object({ mesh: z.string() }),
  created: z.string(),
  modified: z.string(),
});

export type ShadilyManifest = z.infer<typeof shadilyManifestSchema>;

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
  graphSource: z.string(),
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

export const projectFolderPathSchema = z.string().min(1);
export const projectNameSchema = z.string().trim().min(1);
export const projectIdSchema = z.string().uuid();
export const projectCreatePayloadSchema = z.object({
  parentDir: projectFolderPathSchema,
  name: projectNameSchema,
});
export const pickFolderResultSchema = projectFolderPathSchema.nullable();

const paneSizeSchema = z.number().finite().nonnegative();
const paneSizePairSchema = z.tuple([paneSizeSchema, paneSizeSchema]);

export const projectLayoutStateSchema = z.object({
  collapsedPanes: z.object({
    project: z.boolean(),
    source: z.boolean(),
    graph: z.boolean(),
    chat: z.boolean(),
    render: z.boolean(),
  }),
  shellPaneSizes: paneSizePairSchema,
  workspaceColumnSizes: paneSizePairSchema,
  workspaceLeftRowSizes: paneSizePairSchema,
  workspaceRightRowSizes: paneSizePairSchema,
});

export type ProjectLayoutState = z.infer<typeof projectLayoutStateSchema>;

export const projectLayoutRequestSchema = z.object({
  projectId: projectIdSchema,
});

export type ProjectLayoutRequest = z.infer<typeof projectLayoutRequestSchema>;

export const projectLayoutSavePayloadSchema = z.object({
  projectId: projectIdSchema,
  layout: projectLayoutStateSchema,
});

export type ProjectLayoutSavePayload = z.infer<
  typeof projectLayoutSavePayloadSchema
>;

export const projectSavePayloadSchema = z.object({
  folderPath: projectFolderPathSchema,
  manifest: shadilyManifestSchema,
  graphSource: z.string(),
});

export type ProjectSavePayload = z.infer<typeof projectSavePayloadSchema>;

export const projectEntryRequestSchema = z.object({
  folderPath: projectFolderPathSchema,
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
  folderPath: projectFolderPathSchema,
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

export const chatPromptSchema = z.string().trim().min(1);
export const chatThreadStatusSchema = z.enum(["regular", "archived"]);
export const chatRoleSchema = z.enum(["user", "assistant", "system"]);

export const chatThreadSummarySchema = z.object({
  id: z.string().uuid(),
  projectId: projectIdSchema,
  codexThreadId: z.string().min(1).nullable(),
  title: z.string().min(1).nullable(),
  status: chatThreadStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  lastUsedAt: z.string(),
  lastMessageAt: z.string().nullable(),
});

export type ChatThreadSummary = z.infer<typeof chatThreadSummarySchema>;

export const chatTextPartSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("text"),
  text: z.string(),
  parentPartId: z.string().uuid().nullable(),
});

export const chatReasoningPartSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("reasoning"),
  text: z.string(),
  parentPartId: z.string().uuid().nullable(),
});

export const chatImagePartSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("image"),
  imagePath: z.string().min(1),
  filename: z.string().min(1).nullable(),
});

export const chatFilePartSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("file"),
  filePath: z.string().min(1),
  filename: z.string().min(1).nullable(),
  mimeType: z.string().min(1).nullable(),
});

export const chatDataPartSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("data"),
  name: z.string().min(1),
  dataJson: z.string(),
});

export const chatToolCallPartSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("tool-call"),
  toolCallId: z.string().min(1),
  toolName: z.string().min(1),
  argsText: z.string(),
  resultText: z.string().nullable(),
  isError: z.boolean(),
  parentPartId: z.string().uuid().nullable(),
});

export const chatMessagePartSchema = z.discriminatedUnion("type", [
  chatTextPartSchema,
  chatReasoningPartSchema,
  chatImagePartSchema,
  chatFilePartSchema,
  chatDataPartSchema,
  chatToolCallPartSchema,
]);

export type ChatMessagePart = z.infer<typeof chatMessagePartSchema>;
type DistributiveOmit<T, Key extends PropertyKey> = T extends unknown
  ? Omit<T, Key>
  : never;
export type ChatMessagePartInput = DistributiveOmit<ChatMessagePart, "id">;

export const chatMessageStatusSchema = z.object({
  type: z.enum(["running", "complete", "incomplete", "requires-action"]),
  reason: z.string().nullable(),
  errorJson: z.string().nullable(),
});

export type ChatMessageStatus = z.infer<typeof chatMessageStatusSchema>;

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  role: chatRoleSchema,
  runId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: chatMessageStatusSchema.nullable(),
  parts: z.array(chatMessagePartSchema),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatThreadDetailSchema = z.object({
  thread: chatThreadSummarySchema,
  messages: z.array(chatMessageSchema),
});

export type ChatThreadDetail = z.infer<typeof chatThreadDetailSchema>;
export const chatThreadListSchema = z.array(chatThreadSummarySchema);

export const chatProjectRequestSchema = z.object({
  projectId: projectIdSchema,
});

export type ChatProjectRequest = z.infer<typeof chatProjectRequestSchema>;

export const chatThreadRequestSchema = z.object({
  projectId: projectIdSchema,
  threadId: z.string().uuid(),
});

export type ChatThreadRequest = z.infer<typeof chatThreadRequestSchema>;

export const chatSendPayloadSchema = z.object({
  projectId: projectIdSchema,
  threadId: z.string().uuid(),
  prompt: chatPromptSchema,
  previewPath: z.string().nullable().optional(),
  fragmentShaderSource: z.string().nullable().optional(),
});

export type ChatSendPayload = z.infer<typeof chatSendPayloadSchema>;

export const projectCheckpointSchema = z.object({
  id: z.string().uuid(),
  projectId: projectIdSchema,
  threadId: z.string().uuid(),
  messageId: z.string().uuid(),
  previewPath: z.string().nullable(),
  fragmentShaderSource: z.string().nullable(),
  createdAt: z.string(),
});

export type ProjectCheckpoint = z.infer<typeof projectCheckpointSchema>;

export const historyListRequestSchema = z.object({
  projectId: projectIdSchema,
  threadId: z.string().uuid(),
});

export type HistoryListRequest = z.infer<typeof historyListRequestSchema>;

export const historyRevertRequestSchema = z.object({
  checkpointId: z.string().uuid(),
});

export type HistoryRevertRequest = z.infer<typeof historyRevertRequestSchema>;

export type FileChangeInfo = {
  path: string;
  kind: "add" | "delete" | "update";
};
