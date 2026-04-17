import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { AppError, ErrorCode } from "../lib/errors"
import { fail } from "../lib/response"

function mapDbError(cause: unknown): AppError | null {
  const c = cause as Record<string, unknown> | null
  if (!c) return null

  switch (c["errno"]) {
    case "23505": {
      const detail = String(c["detail"] ?? "")
      const field = detail.match(/Key \((\w+)\)/)?.[1] ?? "field"
      const code =
        field === "username"
          ? ErrorCode.USER_USERNAME_EXISTS
          : field === "email"
            ? ErrorCode.USER_EMAIL_EXISTS
            : ErrorCode.CONFLICT
      return new AppError(code, `${field} already exists`, 409)
    }
    case "23503":
      return new AppError(ErrorCode.VALIDATION_ERROR, "Referenced resource not found", 422)
    case "23502":
      return new AppError(ErrorCode.VALIDATION_ERROR, "Missing required field", 422)
    default:
      return null
  }
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return fail(c, err.code, err.message, err.status as ContentfulStatusCode)
  }

  if (err instanceof HTTPException) {
    return fail(c, ErrorCode.VALIDATION_ERROR, err.message, err.status as ContentfulStatusCode)
  }

  // Drizzle wraps postgres errors in cause
  const cause = (err as { cause?: unknown }).cause
  const mapped = mapDbError(cause)
  if (mapped) {
    return fail(c, mapped.code, mapped.message, mapped.status as ContentfulStatusCode)
  }

  console.error("[unhandled]", err)
  return fail(c, ErrorCode.INTERNAL_ERROR, "Internal server error", 500)
}

export function notFoundHandler(c: Context) {
  return fail(c, ErrorCode.NOT_FOUND, `Route ${c.req.method} ${c.req.path} not found`, 404)
}
