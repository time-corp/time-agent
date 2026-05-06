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
