import { Hono } from "hono"
import { z } from "zod"
import { fail, ok } from "../../lib/response"
import { ErrorCode } from "../../lib/errors"
import { createRuntimeTeam } from "../../mastra/runtime-team"
import { listTeamChatMessages, listTeamChatThreads } from "../../services/team-chat-history-service"
import { getChatTrace } from "../../services/chat-trace-service"

const chatIdSchema = z.string().trim().min(1).max(512)
const threadMetadataSchema = z.record(z.string(), z.unknown())
const historyQuerySchema = z.object({ resourceId: chatIdSchema })

type ChatMemory = {
  getThreadById(args: { threadId: string }): Promise<unknown>
  createThread(args: Record<string, unknown>): Promise<unknown>
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
  if (!memory || !threadId || !resourceId) return

  const existingThread = await memory.getThreadById({ threadId })
  if (existingThread) return

  await memory.createThread({
    threadId,
    resourceId,
    ...(title ? { title } : {}),
    ...(metadata ? { metadata } : {}),
  })
}

const saveAssistantErrorMessage = async ({
  memory,
  threadId,
  resourceId,
  text,
}: {
  memory: ChatMemory | null
  threadId?: string
  resourceId?: string
  text: string
}) => {
  if (!memory || !threadId || !resourceId || !text.trim()) return

  await memory.saveMessages({
    messages: [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        createdAt: new Date(),
        threadId,
        resourceId,
        content: {
          format: 2,
          parts: [{ type: "text", text }],
        },
      },
    ],
  })
}

const createSupervisorExecutionOptions = (input: {
  maxSteps: number
  threadId?: string | undefined
  resourceId?: string | undefined
}) => ({
  maxSteps: input.maxSteps,
  delegation: {
    onDelegationStart: (context: {
      primitiveId: string
      primitiveType: "agent" | "workflow"
      prompt: string
      iteration: number
      parentAgentId: string
      parentAgentName: string
      toolCallId: string
    }) => {
      console.log("[chat-team-route] delegation.start", {
        parentAgentId: context.parentAgentId,
        parentAgentName: context.parentAgentName,
        primitiveId: context.primitiveId,
        primitiveType: context.primitiveType,
        iteration: context.iteration,
        toolCallId: context.toolCallId,
        promptPreview: context.prompt.slice(0, 200),
      })
    },
    onDelegationComplete: (context: {
      primitiveId: string
      primitiveType: "agent" | "workflow"
      duration: number
      success: boolean
      error?: Error
      iteration: number
      result: { text: string }
    }) => {
      console.log("[chat-team-route] delegation.complete", {
        primitiveId: context.primitiveId,
        primitiveType: context.primitiveType,
        iteration: context.iteration,
        duration: context.duration,
        success: context.success,
        error: context.error?.message,
        resultPreview: context.result.text.slice(0, 200),
      })
    },
  },
  ...(input.threadId && input.resourceId
    ? { memory: { thread: input.threadId, resource: input.resourceId } }
    : {}),
})

export const chatTeamRoute = new Hono()
  .get("/:teamId/threads", async (c) => {
    const parsed = historyQuerySchema.safeParse(c.req.query())
    if (!parsed.success) {
      return fail(c, ErrorCode.VALIDATION_ERROR, parsed.error.issues.map((i) => i.message).join(", "), 400)
    }
    const teamId = c.req.param("teamId")
    console.log("[chat-team-route] threads.request", { teamId, resourceId: parsed.data.resourceId })
    try {
      const result = await listTeamChatThreads(teamId, parsed.data.resourceId)
      console.log("[chat-team-route] threads.result", { teamId, count: result.length })
      return ok(c, result)
    } catch (err) {
      console.error("[chat-team-route] threads.error", err)
      throw err
    }
  })
  .get("/:teamId/threads/:threadId/messages", async (c) => {
    const parsed = historyQuerySchema.safeParse(c.req.query())
    if (!parsed.success) {
      return fail(c, ErrorCode.VALIDATION_ERROR, parsed.error.issues.map((i) => i.message).join(", "), 400)
    }
    const teamId = c.req.param("teamId")
    const threadId = c.req.param("threadId")
    const resourceId = parsed.data.resourceId
    console.log("[chat-team-route] messages.request", { teamId, threadId, resourceId })
    try {
      const result = await listTeamChatMessages(teamId, threadId, resourceId)
      console.log("[chat-team-route] messages.result", { teamId, threadId, count: result.length })
      return ok(c, result)
    } catch (err) {
      console.error("[chat-team-route] messages.error", err)
      throw err
    }
  })
  .get("/:teamId/threads/:threadId/traces/:traceId", async (c) => {
    const parsed = historyQuerySchema.safeParse(c.req.query())
    if (!parsed.success) {
      return fail(c, ErrorCode.VALIDATION_ERROR, parsed.error.issues.map((i) => i.message).join(", "), 400)
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
  .post("/:teamId/generate", async (c) => {
    const parsed = chatRequestSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      return fail(c, ErrorCode.VALIDATION_ERROR, parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const teamId = c.req.param("teamId")
    console.log("[chat-team-route] generate.request", {
      teamId,
      lastMessage: parsed.data.messages.at(-1)?.content ?? null,
      threadId: parsed.data.threadId ?? null,
      resourceId: parsed.data.resourceId ?? null,
      maxSteps: parsed.data.maxSteps ?? 20,
    })

    const { supervisorAgent, modelSettings } = await createRuntimeTeam(teamId)
    const memory = (await supervisorAgent.getMemory()) ?? null
    console.log("[chat-team-route] generate.memory", { hasMemory: Boolean(memory) })

    await ensureThreadExists({
      memory,
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
      ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
      ...(parsed.data.threadTitle ? { title: parsed.data.threadTitle } : {}),
      ...(parsed.data.threadMetadata ? { metadata: parsed.data.threadMetadata } : {}),
    })
    console.log("[chat-team-route] generate.thread-ready")

    const requestMessages = parsed.data.messages
    console.log("[chat-team-route] generate.calling-supervisor", {
      messageCount: requestMessages.length,
      lastMessageLength: requestMessages.at(-1)?.content.length ?? 0,
    })

    try {
      const result = await supervisorAgent.generate(requestMessages, {
        modelSettings,
        abortSignal: c.req.raw.signal,
        ...createSupervisorExecutionOptions({
          maxSteps: parsed.data.maxSteps ?? 20,
          ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
          ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
        }),
      })
      const text = result.text
      console.log("[chat-team-route] generate.result", { teamId, textLength: text.length, textPreview: text.slice(0, 200) })
      return ok(c, { text, traceId: result.traceId ?? null })
    } catch (err) {
      console.error("[chat-team-route] generate.error", err)
      throw err
    }
  })
  .post("/:teamId/stream", async (c) => {
    const parsed = chatRequestSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      return fail(c, ErrorCode.VALIDATION_ERROR, parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const teamId = c.req.param("teamId")
    console.log("[chat-team-route] stream.request", {
      teamId,
      lastMessage: parsed.data.messages.at(-1)?.content ?? null,
      threadId: parsed.data.threadId ?? null,
      resourceId: parsed.data.resourceId ?? null,
      maxSteps: parsed.data.maxSteps ?? 20,
    })

    const { supervisorAgent, modelSettings } = await createRuntimeTeam(teamId)
    const memory = (await supervisorAgent.getMemory()) ?? null
    console.log("[chat-team-route] stream.memory", { hasMemory: Boolean(memory) })

    await ensureThreadExists({
      memory,
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
      ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
      ...(parsed.data.threadTitle ? { title: parsed.data.threadTitle } : {}),
      ...(parsed.data.threadMetadata ? { metadata: parsed.data.threadMetadata } : {}),
    })
    console.log("[chat-team-route] stream.thread-ready")

    const requestMessages = parsed.data.messages
    console.log("[chat-team-route] stream.calling-supervisor", {
      messageCount: requestMessages.length,
      lastMessageLength: requestMessages.at(-1)?.content.length ?? 0,
    })

    let result: Awaited<ReturnType<typeof supervisorAgent.stream>>
    try {
      result = await supervisorAgent.stream(requestMessages, {
        modelSettings,
        abortSignal: c.req.raw.signal,
        ...createSupervisorExecutionOptions({
          maxSteps: parsed.data.maxSteps ?? 20,
          ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
          ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
        }),
      })
      console.log("[chat-team-route] stream.supervisor-started")
    } catch (err) {
      console.error("[chat-team-route] stream.supervisor-error", err)
      throw err
    }

    const fullReader = result.fullStream.getReader()
    const encoder = new TextEncoder()
    let textChunkCount = 0

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          while (true) {
            const { done, value } = await fullReader.read()
            if (done) {
              console.log("[chat-team-route] stream.done", { textChunkCount })
              controller.close()
              return
            }

            const chunk = value as
              | { type: "text-delta"; text?: string; textDelta?: string }
              | { type: "error"; error?: { message?: string } | string }
              | { type: string }

            if (chunk.type === "text-delta") {
              const text =
                ("text" in chunk && typeof chunk.text === "string" ? chunk.text : "") ||
                ("textDelta" in chunk && typeof chunk.textDelta === "string" ? chunk.textDelta : "")

              if (!text) {
                continue
              }

              textChunkCount++
              console.log("[chat-team-route] stream.text-chunk", {
                textChunkCount,
                chunkLength: text.length,
              })
              controller.enqueue(encoder.encode(text))
              return
            }

            if (chunk.type === "error") {
              const chunkError = "error" in chunk ? chunk.error : undefined
              const errorMessage =
                typeof chunkError === "string"
                  ? chunkError
                  : chunkError?.message ?? "Agent stream failed"
              const displayMessage = `[Error] ${errorMessage}`

              console.error("[chat-team-route] stream.model-error", { errorMessage })
              await saveAssistantErrorMessage({
                memory,
                ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
                ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
                text: displayMessage,
              })
              controller.enqueue(encoder.encode(`\n\n${displayMessage}`))
              controller.close()
              return
            }
          }
        }
        catch (error) {
          console.error("[chat-team-route] stream.pull-error", error)
          const errorMessage = error instanceof Error ? error.message : "Agent stream failed"
          const displayMessage = `[Error] ${errorMessage}`
          await saveAssistantErrorMessage({
            memory,
            ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
            ...(parsed.data.resourceId ? { resourceId: parsed.data.resourceId } : {}),
            text: displayMessage,
          })
          controller.enqueue(encoder.encode(`\n\n${displayMessage}`))
          controller.close()
        }
      },
      async cancel(reason) {
        console.log("[chat-team-route] stream.cancelled", { reason })
        await fullReader.cancel(reason)
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
