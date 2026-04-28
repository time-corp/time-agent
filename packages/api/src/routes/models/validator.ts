import { zValidator } from "@hono/zod-validator"
import { createModelSchema, updateModelSchema } from "@time/shared"
import { ErrorCode } from "../../lib/errors"
import { fail } from "../../lib/response"

export const createModelValidator = zValidator("json", createModelSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})

export const updateModelValidator = zValidator("json", updateModelSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})
