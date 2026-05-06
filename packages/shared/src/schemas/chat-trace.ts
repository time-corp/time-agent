import { z } from "zod"
import { ID_MAX_LENGTH } from "../constants/field-lengths"

const TRACE_TEXT_MAX_LENGTH = 512
const TRACE_TYPE_MAX_LENGTH = 100

export const chatTraceSpanSchema = z.object({
  traceId: z.string().min(1).max(ID_MAX_LENGTH),
  spanId: z.string().min(1).max(ID_MAX_LENGTH),
  parentSpanId: z.string().min(1).max(ID_MAX_LENGTH).nullable(),
  name: z.string().min(1).max(TRACE_TEXT_MAX_LENGTH),
  spanType: z.string().min(1).max(TRACE_TYPE_MAX_LENGTH),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  status: z.enum(["success", "running", "error"]),
  entityType: z.string().max(TRACE_TYPE_MAX_LENGTH).nullable(),
  entityId: z.string().max(ID_MAX_LENGTH).nullable(),
  entityName: z.string().max(TRACE_TEXT_MAX_LENGTH).nullable(),
  error: z.string().max(2000).nullable(),
  durationMs: z.number().int().min(0).nullable(),
})

export const chatTraceSchema = z.object({
  traceId: z.string().min(1).max(ID_MAX_LENGTH),
  spans: z.array(chatTraceSpanSchema),
})

export type ChatTrace = z.infer<typeof chatTraceSchema>
export type ChatTraceSpan = z.infer<typeof chatTraceSpanSchema>
