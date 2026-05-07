import type { ChatHistoryMessage, ChatHistoryThread } from "@time/shared"
import type { MastraDBMessage } from "@mastra/core/agent/message-list"
import { createAgentMemory } from "../mastra/memory"
import { AppError, ErrorCode } from "../lib/errors"
import { createLogger } from "../lib/logger"
import { attachTraceIdsToMessages } from "./chat-trace-service"

const log = createLogger("team-chat-history")
import { extractMessageText } from "./mastra-message-service"

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) return new Date(0).toISOString()
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

const isSuppressedCompletionFeedback = (message: MastraDBMessage) => {
  const metadata = (message.content as { metadata?: unknown }).metadata
  if (!metadata || typeof metadata !== "object") return false

  const completionResult = (metadata as { completionResult?: unknown }).completionResult
  if (!completionResult || typeof completionResult !== "object") return false

  return true
}

const COMPLETION_CHECK_MARKER = "Completion Check Results"

const normalizeTeamAssistantContent = (content: string) => {
  if (!content) return ""
  if (content.includes(COMPLETION_CHECK_MARKER)) return ""

  if (!content.startsWith("{")) {
    return content
  }

  try {
    const parsed = JSON.parse(content) as {
      finalResult?: { text?: unknown }
      text?: unknown
    }

    if (typeof parsed.finalResult?.text === "string" && parsed.finalResult.text.trim()) {
      return parsed.finalResult.text.trim()
    }

    if (typeof parsed.text === "string" && parsed.text.trim()) {
      return parsed.text.trim()
    }
  } catch {
    return content
  }

  return content
}

// Teams use a shared default memory (no per-agent config needed)
const createTeamMemory = () => createAgentMemory({})

export const listTeamChatThreads = async (
  teamId: string,
  resourceId: string,
): Promise<ChatHistoryThread[]> => {
  const memory = createTeamMemory()
  const result = await memory.listThreads({
    perPage: false,
    orderBy: { field: "updatedAt", direction: "DESC" },
    filter: {
      resourceId,
      metadata: { teamId },
    },
  })

  return result.threads.map((thread) => ({
    id: thread.id,
    resourceId: thread.resourceId,
    title: thread.title ?? null,
    createdAt: toIsoString(thread.createdAt),
    updatedAt: toIsoString(thread.updatedAt),
  }))
}

export const listTeamChatMessages = async (
  teamId: string,
  threadId: string,
  resourceId: string,
): Promise<ChatHistoryMessage[]> => {
  const memory = createTeamMemory()
  const thread = await memory.getThreadById({ threadId })

  log.debug({ teamId, threadId, resourceId, found: Boolean(thread), resourceIdMatch: thread?.resourceId === resourceId }, "messages.thread-lookup")

  if (!thread || thread.resourceId !== resourceId) {
    throw new AppError(ErrorCode.NOT_FOUND, "Chat thread not found", 404)
  }

  const result = await memory.recall({ threadId, resourceId, perPage: false })

  const messages = result.messages
    .filter((message) => !isSuppressedCompletionFeedback(message))
    .map((message) => {
      const content = extractMessageText(message)
      const normalizedContent =
        message.role === "assistant" ? normalizeTeamAssistantContent(content) : content

      return {
        id: message.id,
        role: message.role,
        content: normalizedContent,
        createdAt: toIsoString(message.createdAt),
      }
    })
    .filter((message) => message.content.length > 0)

  return attachTraceIdsToMessages(messages, threadId, resourceId)
}
