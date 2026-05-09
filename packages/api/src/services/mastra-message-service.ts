import type { ChatAttachment } from "@time/shared"
import type { MastraDBMessage } from "@mastra/core/agent/message-list"

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

export const extractMessageAttachments = (message: MastraDBMessage): ChatAttachment[] => {
  const metadata = message.content.metadata

  if (!metadata || typeof metadata !== "object" || !("attachments" in metadata)) {
    return []
  }

  const attachments = (metadata as { attachments?: unknown }).attachments
  if (!Array.isArray(attachments)) {
    return []
  }

  return attachments.filter(
    (attachment): attachment is ChatAttachment =>
      typeof attachment === "object" &&
      attachment !== null &&
      (attachment as { type?: unknown }).type === "image" &&
      typeof (attachment as { url?: unknown }).url === "string" &&
      typeof (attachment as { mimeType?: unknown }).mimeType === "string",
  )
}
