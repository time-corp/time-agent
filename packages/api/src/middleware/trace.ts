import { createMiddleware } from "hono/factory"

export const traceMiddleware = createMiddleware(async (c, next) => {
  const traceId = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
  c.set("traceId", traceId)
  c.header("X-Trace-Id", traceId)
  await next()
})
