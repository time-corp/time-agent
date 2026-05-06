import { Hono } from "hono"
import { z } from "zod"
import { fail, ok } from "../../lib/response"
import { ErrorCode } from "../../lib/errors"
import { createRuntimeAgent } from "../../mastra/runtime-agent"
import { listChatMessages, listChatThreads } from "../../services/chat-history-service"
import { getChatTrace } from "../../services/chat-trace-service"

const chatIdSchema = z.string().trim().min(1).max(512)
const threadMetadataSchema = z.record(z.string(), z.unknown())
const historyQuerySchema = z.object({
  resourceId: chatIdSchema,
})

type ChatMemory = {
  getThreadById(args: { threadId: string }): Promise<unknown>
  createThread(args: {
    threadId: string
    resourceId: string
    title?: string
    metadata?: Record<string, unknown>
  }): Promise<unknown>
}

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(20000),
    })
  ).min(1),
  threadId: chatIdSchema.optional(),
  resourceId: chatIdSchema.optional(),
  threadTitle: z.string().trim().min(1).max(200).optional(),
  threadMetadata: threadMetadataSchema.optional(),
}).superRefine((value, ctx) => {
  if ((value.threadId && !value.resourceId) || (!value.threadId && value.resourceId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "threadId and resourceId must be provided together",
      path: value.threadId ? ["resourceId"] : ["threadId"],
    })
  }
})

const ensureThreadExists = async ({
  memory,
  threadId,
  resourceId,
  title,
  metadata,
}: {
  memory: ChatMemory | null
  threadId?: string
  resourceId?: string
  title?: string
  metadata?: Record<string, unknown>
}) => {
  if (!memory || !threadId || !resourceId) {
    return
  }

  const existingThread = await memory.getThreadById({ threadId })
  if (existingThread) {
    return
  }

  await memory.createThread({
    threadId,
    resourceId,
    ...(title ? { title } : {}),
    ...(metadata ? { metadata } : {}),
  })
}

export const chatRoute = new Hono()
  .get("/:agentConfigId/threads", async (c) => {
    const parsed = historyQuerySchema.safeParse(c.req.query())
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ")
      return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
    }

    return ok(c, await listChatThreads(c.req.param("agentConfigId"), parsed.data.resourceId))
  })
  .get("/:agentConfigId/threads/:threadId/messages", async (c) => {
    const parsed = historyQuerySchema.safeParse(c.req.query())
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ")
      return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
    }

    return ok(
      c,
      await listChatMessages(
        c.req.param("agentConfigId"),
        c.req.param("threadId"),
        parsed.data.resourceId,
      ),
    )
  })
  .get("/:agentConfigId/threads/:threadId/traces/:traceId", async (c) => {
    const parsed = historyQuerySchema.safeParse(c.req.query())
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ")
      return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
    }

    return ok(
      c,
      await getChatTrace(
        c.req.param("traceId"),
        parsed.data.resourceId,
        c.req.param("threadId"),
      ),
    )
  })
  .post("/:agentConfigId/generate", async (c) => {
    const parsed = chatRequestSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ")
      return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
    }

    console.log("[chat-route] generate.request", {
      agentConfigId: c.req.param("agentConfigId"),
      messageCount: parsed.data.messages.length,
      lastMessage: parsed.data.messages.at(-1)?.content ?? null,
      threadId: parsed.data.threadId ?? null,
      resourceId: parsed.data.resourceId ?? null,
    })

    const { agent, modelSettings } = await createRuntimeAgent(c.req.param("agentConfigId"))
    const memory = (await agent.getMemory()) ?? null

    await ensureThreadExists({
      memory,
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
      ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
      ...(parsed.data.threadTitle ? { title: parsed.data.threadTitle } : {}),
      ...(parsed.data.threadMetadata ? { metadata: parsed.data.threadMetadata } : {}),
    })

    const result = await agent.generate(parsed.data.messages, {
      modelSettings,
      abortSignal: c.req.raw.signal,
      ...(parsed.data.threadId && parsed.data.resourceId
        ? {
            memory: {
              thread: parsed.data.threadId,
              resource: parsed.data.resourceId,
            },
          }
        : {}),
    })

    console.log("[chat-route] generate.result", {
      agentConfigId: c.req.param("agentConfigId"),
      textPreview: result.text.slice(0, 300),
      finishReason: result.finishReason,
      usage: result.usage,
      warnings: result.warnings,
      response: result.response,
      providerMetadata: result.providerMetadata,
    })

    return ok(c, { text: result.text, traceId: result.traceId ?? null })
  })
  .post("/:agentConfigId/stream", async (c) => {
    const parsed = chatRequestSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ")
      return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
    }

    console.log("[chat-route] stream.request", {
      agentConfigId: c.req.param("agentConfigId"),
      messageCount: parsed.data.messages.length,
      lastMessage: parsed.data.messages.at(-1)?.content ?? null,
      threadId: parsed.data.threadId ?? null,
      resourceId: parsed.data.resourceId ?? null,
    })

    const { agent, modelSettings } = await createRuntimeAgent(c.req.param("agentConfigId"))
    const memory = (await agent.getMemory()) ?? null

    await ensureThreadExists({
      memory,
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
      ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
      ...(parsed.data.threadTitle ? { title: parsed.data.threadTitle } : {}),
      ...(parsed.data.threadMetadata ? { metadata: parsed.data.threadMetadata } : {}),
    })

    const result = await agent.stream(parsed.data.messages, {
      modelSettings,
      abortSignal: c.req.raw.signal,
      ...(parsed.data.threadId && parsed.data.resourceId
        ? {
            memory: {
              thread: parsed.data.threadId,
              resource: parsed.data.resourceId,
            },
          }
        : {}),
    })
    const reader = result.textStream.getReader()
    const encoder = new TextEncoder()

    void Promise.all([
      result.finishReason,
      result.usage,
      result.warnings,
      result.response,
      result.providerMetadata,
      result.text,
    ])
      .then(([finishReason, usage, warnings, response, providerMetadata, text]) => {
        console.log("[chat-route] stream.result", {
          agentConfigId: c.req.param("agentConfigId"),
          textPreview: text.slice(0, 300),
          finishReason,
          usage,
          warnings,
          response,
          providerMetadata,
        })
      })
      .catch((error) => {
        console.error("[chat-route] stream.result.error", {
          agentConfigId: c.req.param("agentConfigId"),
          error,
        })
      })

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read()

          if (done) {
            controller.close()
            return
          }

          controller.enqueue(encoder.encode(value))
        } catch (error) {
          controller.error(error)
        }
      },
      async cancel(reason) {
        await reader.cancel(reason)
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        ...(result.traceId ? { "X-Mastra-Trace-Id": result.traceId } : {}),
      },
    })
  })
