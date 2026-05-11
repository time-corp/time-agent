import type { ChatArtifact, ChatAttachment } from "@time/shared"
import type { MastraDBMessage } from "@mastra/core/agent/message-list"
import { normalizeChatArtifacts, parseStructuredChatResponse } from "./chat-response-service"

const extractTextParts = (message: MastraDBMessage) =>
  message.content.parts
    .flatMap((part) =>
      part.type === "text" && typeof part.text === "string" ? [part.text] : []
    )
    .join("")
    .trim()

export const extractMessageText = (message: MastraDBMessage) => {
  if (typeof message.content.content === "string" && message.content.content.trim()) {
    return message.content.content.trim()
  }

  return extractTextParts(message)
}

export const extractMessageArtifacts = (message: MastraDBMessage): ChatArtifact[] => {
  const metadata = message.content.metadata

  if (metadata && typeof metadata === "object") {
    const normalized = normalizeChatArtifacts(
      Array.isArray((metadata as { artifacts?: unknown }).artifacts)
        ? ((metadata as { artifacts?: ChatArtifact[] }).artifacts ?? [])
        : undefined,
      Array.isArray((metadata as { attachments?: unknown }).attachments)
        ? ((metadata as { attachments?: ChatAttachment[] }).attachments ?? [])
        : undefined,
    )

    if (normalized.artifacts.length > 0) {
      return normalized.artifacts
    }
  }

  const parsed = parseStructuredChatResponse(extractMessageText(message))
  return parsed.artifacts ?? []
}

export const extractMessageAttachments = (message: MastraDBMessage): ChatAttachment[] =>
  normalizeChatArtifacts(extractMessageArtifacts(message)).attachments
