import type { ChatHistoryMessage, ChatTrace } from "@time/shared"
import { AppError, ErrorCode } from "../lib/errors"
import { getMastraStorage } from "../mastra/storage"

const TRACE_PAGE_SIZE = 100
const MESSAGE_TRACE_WINDOW_MS = 15 * 60 * 1000

type TraceRootSpan = {
  traceId: string
  startedAt: Date
  endedAt?: Date | null
  output?: unknown
  error?: unknown
}

type TraceSpan = {
  traceId: string
  spanId: string
  parentSpanId?: string | null
  name: string
  spanType: string
  startedAt: Date
  endedAt?: Date | null
  entityType?: string | null
  entityId?: string | null
  entityName?: string | null
  threadId?: string | null
  resourceId?: string | null
  error?: unknown
}

const getObservabilityStore = async () => {
  const store = await getMastraStorage().getStore("observability")
  if (!store) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Mastra observability store is not configured", 500)
  }

  return store
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim()

const extractText = (value: unknown): string => {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join(" ")
  }

  if (!value || typeof value !== "object") {
    return ""
  }

  const candidateValues = Object.values(value as Record<string, unknown>)
  return candidateValues.map(extractText).filter(Boolean).join(" ")
}

const getTraceStatus = (span: { error?: unknown; endedAt?: Date | null }) => {
  if (span.error) return "error" as const
  if (!span.endedAt) return "running" as const
  return "success" as const
}

const formatError = (value: unknown) => {
  if (!value) return null
  if (typeof value === "string") return value.slice(0, 2000)

  try {
    return JSON.stringify(value).slice(0, 2000)
  } catch {
    return String(value).slice(0, 2000)
  }
}

export const listThreadTraceRoots = async (threadId: string, resourceId: string): Promise<TraceRootSpan[]> => {
  const store = await getObservabilityStore()
  const traces: TraceRootSpan[] = []
  let page = 0

  while (true) {
    const result = await store.listTraces({
      filters: {
        threadId,
        resourceId,
      },
      pagination: {
        page,
        perPage: TRACE_PAGE_SIZE,
      },
      orderBy: {
        field: "startedAt",
        direction: "ASC",
      },
    })

    traces.push(
      ...result.spans.map((span) => ({
        traceId: span.traceId,
        startedAt: span.startedAt,
        endedAt: span.endedAt,
        output: span.output,
        error: span.error,
      })),
    )

    if (!result.pagination.hasMore) {
      break
    }

    page += 1
  }

  return traces
}

export const attachTraceIdsToMessages = async (
  messages: ChatHistoryMessage[],
  threadId: string,
  resourceId: string,
): Promise<ChatHistoryMessage[]> => {
  const traces = await listThreadTraceRoots(threadId, resourceId)
  if (traces.length === 0) {
    return messages
  }

  const usedTraceIds = new Set<string>()

  return messages.map((message) => {
    if (message.role !== "assistant") {
      return message
    }

    const messageTime = new Date(message.createdAt).getTime()
    const normalizedContent = normalizeText(message.content)
    const preview = normalizedContent.slice(0, 160)

    const exactMatch = preview
      ? traces.find((trace) => {
      if (usedTraceIds.has(trace.traceId)) return false
      const outputText = normalizeText(extractText(trace.output))
      if (!outputText) return false

      return (
        outputText.includes(preview) ||
        preview.includes(outputText.slice(0, Math.min(outputText.length, 160)))
      )
    })
      : undefined

    const timedMatch = traces.find((trace) => {
      if (usedTraceIds.has(trace.traceId)) return false

      const traceStart = trace.startedAt.getTime()
      return traceStart <= messageTime && messageTime - traceStart <= MESSAGE_TRACE_WINDOW_MS
    })

    const fallbackMatch = traces.find((trace) => !usedTraceIds.has(trace.traceId))
    const matchedTrace = exactMatch ?? timedMatch ?? fallbackMatch

    if (!matchedTrace) {
      return message
    }

    usedTraceIds.add(matchedTrace.traceId)
    return {
      ...message,
      traceId: matchedTrace.traceId,
    }
  })
}

export const getChatTrace = async (traceId: string, resourceId: string, threadId: string): Promise<ChatTrace> => {
  const store = await getObservabilityStore()
  const trace = await store.getTrace({ traceId })

  if (!trace) {
    throw new AppError(ErrorCode.NOT_FOUND, "Trace not found", 404)
  }

  const spans = (trace.spans as TraceSpan[])
    .filter((span) => span.traceId === traceId)
    .sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())

  const rootSpan = spans.find((span) => !span.parentSpanId)
  if (!rootSpan) {
    throw new AppError(ErrorCode.NOT_FOUND, "Trace root span not found", 404)
  }

  if (rootSpan.resourceId && rootSpan.resourceId !== resourceId) {
    throw new AppError(ErrorCode.NOT_FOUND, "Trace does not belong to this resource", 404)
  }

  if (rootSpan.threadId && rootSpan.threadId !== threadId) {
    throw new AppError(ErrorCode.NOT_FOUND, "Trace does not belong to this thread", 404)
  }

  return {
    traceId,
    spans: spans.map((span) => ({
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId ?? null,
      name: span.name.slice(0, 512),
      spanType: span.spanType,
      startedAt: span.startedAt.toISOString(),
      endedAt: span.endedAt?.toISOString() ?? null,
      status: getTraceStatus(span),
      entityType: span.entityType ?? null,
      entityId: span.entityId ?? null,
      entityName: span.entityName ?? null,
      error: formatError(span.error),
      durationMs: span.endedAt ? Math.max(0, span.endedAt.getTime() - span.startedAt.getTime()) : null,
    })),
  }
}
