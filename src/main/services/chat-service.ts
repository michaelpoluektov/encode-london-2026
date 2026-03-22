import type {
  ChatProjectRequest,
  ChatSendPayload,
  ChatThreadDetail,
  ChatThreadRequest,
  ChatThreadSummary,
  FileChangeInfo,
  HistoryListRequest,
  HistoryRevertRequest,
  ProjectCheckpoint,
} from "../../shared/contracts";
import {
  createChatThread,
  deleteChatThread,
  getChatThreadDetail,
  getOrCreateActiveChatThread,
  listChatThreads,
  setActiveChatThread,
  truncateChatThreadFrom,
} from "./chat-persistence";
import * as codexRuntime from "./codex-runtime";
import {
  getCheckpointFileSnapshots,
  getCheckpointInfo,
  getProjectFolderPath,
  listCheckpoints,
} from "./project-metadata";
import { listProjectSnapshotPaths } from "./project-snapshot-files";

export const listProjectThreads = async (
  projectId: string,
): Promise<readonly ChatThreadSummary[]> => listChatThreads(projectId);

export const getActiveThread = async (
  request: ChatProjectRequest,
): Promise<ChatThreadDetail> => getOrCreateActiveChatThread(request.projectId);

export const createThread = async (
  request: ChatProjectRequest,
): Promise<ChatThreadDetail> => {
  const thread = await createChatThread(request.projectId);
  return getChatThreadDetail(request.projectId, thread.id);
};

export const switchThread = async (
  request: ChatThreadRequest,
): Promise<ChatThreadDetail> => {
  await setActiveChatThread(request.projectId, request.threadId);
  return getChatThreadDetail(request.projectId, request.threadId);
};

export const deleteThread = async (
  request: ChatThreadRequest,
): Promise<ChatThreadDetail> => {
  codexRuntime.disposeThreadSession(request.threadId);
  await deleteChatThread(request.projectId, request.threadId);
  return getOrCreateActiveChatThread(request.projectId);
};

export const sendMessage = async (
  payload: ChatSendPayload,
  onChunk: (text: string) => void,
  onFileChange: (changes: FileChangeInfo[]) => void,
): Promise<ChatThreadDetail> => {
  await setActiveChatThread(payload.projectId, payload.threadId);
  await codexRuntime.sendMessage(
    {
      projectId: payload.projectId,
      threadId: payload.threadId,
      prompt: payload.prompt,
      previewPath: payload.previewPath ?? null,
      previewSnapshot: payload.previewSnapshot ?? null,
      fragmentShaderSource: payload.fragmentShaderSource ?? null,
    },
    onChunk,
    onFileChange,
  );
  return getChatThreadDetail(payload.projectId, payload.threadId);
};

export const stopActiveTurn = (): void => {
  codexRuntime.abortActiveTurn();
};

export const listThreadCheckpoints = async (
  request: HistoryListRequest,
): Promise<ProjectCheckpoint[]> =>
  listCheckpoints(request.projectId, request.threadId);

export const revertToCheckpoint = async (
  request: HistoryRevertRequest,
): Promise<ChatThreadDetail> => {
  const { mkdir, rm, writeFile } = await import("node:fs/promises");
  const { join, dirname } = await import("node:path");

  const info = await getCheckpointInfo(request.checkpointId);
  if (info === null) {
    throw new Error("Checkpoint not found.");
  }
  const { projectId, threadId, messageId } = info;

  const folderPath = await getProjectFolderPath(projectId);
  if (folderPath === null) {
    throw new Error("Project folder not found.");
  }

  const snapshots = await getCheckpointFileSnapshots(request.checkpointId);
  if (snapshots === null) {
    throw new Error("Checkpoint file snapshots not found.");
  }

  const currentSnapshotPaths = await listProjectSnapshotPaths(folderPath);
  const snapshotPathSet = new Set(Object.keys(snapshots));

  for (const relativePath of currentSnapshotPaths) {
    if (snapshotPathSet.has(relativePath)) {
      continue;
    }

    await rm(join(folderPath, relativePath), { force: true });
  }

  // Restore files.
  for (const [relativePath, content] of Object.entries(snapshots)) {
    const fullPath = join(folderPath, relativePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf-8");
  }

  // Truncate chat history from this message onward and reset Codex thread.
  codexRuntime.disposeThreadSession(threadId);
  await truncateChatThreadFrom(threadId, messageId);

  return getChatThreadDetail(projectId, threadId);
};
