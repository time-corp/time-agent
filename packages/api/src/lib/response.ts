import type { Context } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json(
    {
      success: true,
      traceId: c.get("traceId") as string,
      data,
    },
    status
  )
}

export function fail(
  c: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode = 400
) {
  return c.json(
    {
      success: false,
      traceId: c.get("traceId") as string,
      error: { code, message },
    },
    status
  )
}
