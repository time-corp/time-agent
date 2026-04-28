import { zValidator } from "@hono/zod-validator"
import { createAgentConfigSchema, updateAgentConfigSchema } from "@time/shared"
import { ErrorCode } from "../../lib/errors"
import { fail } from "../../lib/response"

export const createAgentConfigValidator = zValidator("json", createAgentConfigSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})

export const updateAgentConfigValidator = zValidator("json", updateAgentConfigSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})
