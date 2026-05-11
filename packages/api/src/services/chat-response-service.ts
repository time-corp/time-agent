import { chatResponseSchema, type ChatArtifact, type ChatAttachment, type ChatResponse } from "@time/shared"

const toImageAttachments = (artifacts: ChatArtifact[]): ChatAttachment[] =>
  artifacts.filter((artifact): artifact is ChatAttachment => artifact.type === "image")

export const normalizeChatArtifacts = (
  artifacts?: ChatArtifact[],
  attachments?: ChatAttachment[],
) => {
  if (artifacts?.length) {
    return {
      artifacts,
      attachments: toImageAttachments(artifacts),
    }
  }

  if (attachments?.length) {
    return {
      artifacts: attachments,
      attachments,
    }
  }

  return {
    artifacts: [] as ChatArtifact[],
    attachments: [] as ChatAttachment[],
  }
}

const parseCandidateResponse = (value: unknown): ChatResponse | null => {
  const parsed = chatResponseSchema.safeParse(value)
  if (parsed.success) {
    const normalized = normalizeChatArtifacts(parsed.data.artifacts, parsed.data.attachments)
    return {
      ...parsed.data,
      ...(normalized.artifacts.length ? { artifacts: normalized.artifacts } : {}),
      ...(normalized.attachments.length ? { attachments: normalized.attachments } : {}),
    }
  }

  return null
}

export const parseStructuredChatResponse = (rawText: string): ChatResponse => {
  const text = rawText.trim()
  if (!text.startsWith("{")) {
    return { text: rawText }
  }

  try {
    const parsedJson = JSON.parse(text) as {
      finalResult?: unknown
      text?: unknown
      artifacts?: unknown
      attachments?: unknown
    }

    const direct = parseCandidateResponse(parsedJson)
    if (direct) return direct

    const finalResult = parseCandidateResponse(parsedJson.finalResult)
    if (finalResult) return finalResult
  } catch {
    return { text: rawText }
  }

  return { text: rawText }
}
