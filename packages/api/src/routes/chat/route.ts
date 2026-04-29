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

    const { agent, modelSettings } = await createRuntimeAgent(c.req.param("agentConfigId"))
    const result = await agent.generate(parsed.data.messages, { modelSettings })

    return ok(c, { text: result.text })
  })
  .post("/:agentConfigId/stream", async (c) => {
    const parsed = chatRequestSchema.safeParse(await c.req.json())
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ")
      return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
    }

    const { agent, modelSettings } = await createRuntimeAgent(c.req.param("agentConfigId"))
    const result = await agent.stream(parsed.data.messages, { modelSettings })
    const reader = result.textStream.getReader()
    const encoder = new TextEncoder()

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
