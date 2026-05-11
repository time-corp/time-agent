import { Hono } from "hono"
import type { ChatArtifact, ChatAttachment } from "@time/shared"
import { z } from "zod"
import { fail, ok } from "../../lib/response"
import { ErrorCode } from "../../lib/errors"
import { createLogger } from "../../lib/logger"
import { createRuntimeAgent } from "../../mastra/runtime-agent"
import { createAgentMemory } from "../../mastra/memory"
import { listChatMessages, listChatThreads } from "../../services/chat-history-service"
import { getChatTrace } from "../../services/chat-trace-service"
import { getAgentConfigById } from "../../services/agent-config-service"
import { generateImageForAgent } from "../../services/image-generation-service"

const log = createLogger("chat-route")

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
  saveMessages(args: Record<string, unknown>): Promise<unknown>
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
  maxSteps: z.number().int().min(1).max(50).optional(),
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

const createExecutionOptions = (input: {
  maxSteps: number
  threadId?: string
  resourceId?: string
}) => ({
  maxSteps: input.maxSteps,
  ...(input.threadId && input.resourceId
    ? {
        memory: {
          thread: input.threadId,
          resource: input.resourceId,
        },
  }
    : {}),
})

const saveMessagesToMemory = async ({
  memory,
  threadId,
  resourceId,
  messages,
}: {
  memory: ChatMemory | null
  threadId?: string
  resourceId?: string
  messages: Array<{
    role: "user" | "assistant"
    content: string
    artifacts?: ChatArtifact[]
    attachments?: ChatAttachment[]
  }>
}) => {
  if (!memory || !threadId || !resourceId || messages.length === 0) {
    return
  }

  await memory.saveMessages({
    messages: messages.map((message) => ({
      id: crypto.randomUUID(),
      role: message.role,
      createdAt: new Date(),
      threadId,
      resourceId,
        content: {
          format: 2 as const,
          parts: [{ type: "text", text: message.content }],
          ...(message.artifacts?.length || message.attachments?.length
            ? {
                metadata: {
                  ...(message.artifacts?.length ? { artifacts: message.artifacts } : {}),
                  ...(message.attachments?.length ? { attachments: message.attachments } : {}),
                },
              }
            : {}),
      },
    })),
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

    const agentConfigId = c.req.param("agentConfigId")
    log.debug({ agentConfigId, messageCount: parsed.data.messages.length, threadId: parsed.data.threadId ?? null, resourceId: parsed.data.resourceId ?? null }, "generate.request")

    const agentConfig = await getAgentConfigById(agentConfigId)

    if (agentConfig.agentMode === "image_generate") {
      const resolvedMemory = parsed.data.threadId && parsed.data.resourceId
        ? (createAgentMemory(agentConfig.memoryConfig) as unknown as ChatMemory)
        : null

      await ensureThreadExists({
        memory: resolvedMemory,
        ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
        ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
        ...(parsed.data.threadTitle ? { title: parsed.data.threadTitle } : {}),
        ...(parsed.data.threadMetadata ? { metadata: parsed.data.threadMetadata } : {}),
      })

      const prompt = parsed.data.messages
        .filter((message) => message.role === "user")
        .map((message) => message.content.trim())
        .filter(Boolean)
        .join("\n\n")

      if (!prompt) {
        return fail(c, ErrorCode.VALIDATION_ERROR, "Image generation requires a user prompt", 400)
      }

      const result = await generateImageForAgent({
        agentConfigId,
        prompt,
      })

      await saveMessagesToMemory({
        memory: resolvedMemory,
        ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
        ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
        messages: [
          ...parsed.data.messages,
          {
            role: "assistant",
            content: result.text,
            artifacts: result.artifacts,
            attachments: result.attachments,
          },
        ],
      })

      log.debug({ agentConfigId, artifactCount: result.artifacts.length }, "generate.image.result")
      return ok(c, {
        text: result.text,
        artifacts: result.artifacts,
        attachments: result.attachments,
        traceId: null,
      })
    }

    const { agent, modelSettings } = await createRuntimeAgent(agentConfigId)
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
      ...createExecutionOptions({
        maxSteps: parsed.data.maxSteps ?? 20,
        ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
        ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
      }),
    })

    log.debug({ agentConfigId, textPreview: result.text.slice(0, 300), finishReason: result.finishReason, usage: result.usage }, "generate.result")

    return ok(c, { text: result.text, traceId: result.traceId ?? null })
  })
  .post("/:agentConfigId/stream", async (c) => {
    const parsed = chatRequestSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ")
      return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
    }

    const agentConfigId = c.req.param("agentConfigId")
    log.debug({ agentConfigId, messageCount: parsed.data.messages.length, threadId: parsed.data.threadId ?? null, resourceId: parsed.data.resourceId ?? null }, "stream.request")

    const agentConfig = await getAgentConfigById(agentConfigId)
    if (agentConfig.agentMode === "image_generate") {
      return fail(c, ErrorCode.VALIDATION_ERROR, "Image generation agents support generate mode only", 422)
    }

    const { agent, modelSettings } = await createRuntimeAgent(agentConfigId)
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
      ...createExecutionOptions({
        maxSteps: parsed.data.maxSteps ?? 20,
        ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
        ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
      }),
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
        log.debug({ agentConfigId, textPreview: text.slice(0, 300), finishReason, usage }, "stream.result")
      })
      .catch((error) => {
        log.error({ agentConfigId, error }, "stream.result.error")
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
