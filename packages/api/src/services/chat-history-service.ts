import type { ChatHistoryMessage, ChatHistoryThread } from "@time/shared";
import { createAgentMemory } from "../mastra/memory";
import { AppError, ErrorCode } from "../lib/errors";
import { getAgentConfigById } from "./agent-config-service";
import { attachTraceIdsToMessages } from "./chat-trace-service";
import { extractMessageAttachments, extractMessageText } from "./mastra-message-service";

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) {
    return new Date(0).toISOString();
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const createHistoryMemory = async (agentConfigId: string) => {
  const agentConfig = await getAgentConfigById(agentConfigId);
  return createAgentMemory(agentConfig.memoryConfig);
};

export const listChatThreads = async (
  agentConfigId: string,
  resourceId: string,
): Promise<ChatHistoryThread[]> => {
  const memory = await createHistoryMemory(agentConfigId);
  const result = await memory.listThreads({
    perPage: false,
    orderBy: {
      field: "updatedAt",
      direction: "DESC",
    },
    filter: {
      resourceId,
      metadata: {
        agentConfigId,
      },
    },
  });

  return result.threads.map((thread) => ({
    id: thread.id,
    resourceId: thread.resourceId,
    title: thread.title ?? null,
    createdAt: toIsoString(thread.createdAt),
    updatedAt: toIsoString(thread.updatedAt),
  }));
};

export const listChatMessages = async (
  agentConfigId: string,
  threadId: string,
  resourceId: string,
): Promise<ChatHistoryMessage[]> => {
  const memory = await createHistoryMemory(agentConfigId);
  const thread = await memory.getThreadById({ threadId });

  if (!thread || thread.resourceId !== resourceId) {
    throw new AppError(ErrorCode.NOT_FOUND, "Chat thread not found", 404);
  }

  const result = await memory.recall({
    threadId,
    resourceId,
    perPage: false,
  });

  const messages = result.messages
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: extractMessageText(message),
      attachments: extractMessageAttachments(message),
      createdAt: toIsoString(message.createdAt),
    }))
    .filter((message) => message.content.length > 0 || (message.attachments?.length ?? 0) > 0);

  return attachTraceIdsToMessages(messages, threadId, resourceId)
};
