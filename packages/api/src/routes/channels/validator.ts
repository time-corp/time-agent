import { zValidator } from "@hono/zod-validator"
import { createChannelSchema, updateChannelSchema } from "@time/shared"
import { ErrorCode } from "../../lib/errors"
import { fail } from "../../lib/response"

export const createChannelValidator = zValidator("json", createChannelSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})

export const updateChannelValidator = zValidator("json", updateChannelSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})
