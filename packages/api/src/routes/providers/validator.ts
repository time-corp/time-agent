import { zValidator } from "@hono/zod-validator"
import { createProviderSchema, updateProviderSchema } from "@time/shared"
import { ErrorCode } from "../../lib/errors"
import { fail } from "../../lib/response"

export const createProviderValidator = zValidator("json", createProviderSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})

export const updateProviderValidator = zValidator("json", updateProviderSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})
