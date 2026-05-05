import { Hono } from "hono"
import { z } from "zod"
import { fail, ok } from "../../lib/response"
import { ErrorCode } from "../../lib/errors"
import { createRuntimeAgent } from "../../mastra/runtime-agent"

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(20000),
    })
  ).min(1),
})

export const chatRoute = new Hono()
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
    })

    const { agent, modelSettings } = await createRuntimeAgent(c.req.param("agentConfigId"))
    const result = await agent.generate(parsed.data.messages, { modelSettings })

    console.log("[chat-route] generate.result", {
      agentConfigId: c.req.param("agentConfigId"),
      textPreview: result.text.slice(0, 300),
      finishReason: result.finishReason,
      usage: result.usage,
      warnings: result.warnings,
      response: result.response,
      providerMetadata: result.providerMetadata,
    })

    return ok(c, { text: result.text })
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
    })

    const { agent, modelSettings } = await createRuntimeAgent(c.req.param("agentConfigId"))
    const result = await agent.stream(parsed.data.messages, { modelSettings })
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
      },
    })
  })
