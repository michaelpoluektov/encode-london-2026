import type {
  ChatProjectRequest,
  ChatSendPayload,
  ChatThreadDetail,
  ChatThreadRequest,
  ChatThreadSummary,
  FileChangeInfo,
} from "../../shared/contracts";
import {
  createChatThread,
  deleteChatThread,
  getChatThreadDetail,
  getOrCreateActiveChatThread,
  listChatThreads,
  setActiveChatThread,
} from "./chat-persistence";
import * as codexRuntime from "./codex-runtime";

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
  await codexRuntime.sendMessage(payload, onChunk, onFileChange);
  return getChatThreadDetail(payload.projectId, payload.threadId);
};

export const stopActiveTurn = (): void => {
  codexRuntime.abortActiveTurn();
};
