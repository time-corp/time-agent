import { zValidator } from "@hono/zod-validator"
import { createAgentTeamSchema, updateAgentTeamSchema } from "@time/shared"
import { ErrorCode } from "../../lib/errors"
import { fail } from "../../lib/response"

export const createAgentTeamValidator = zValidator("json", createAgentTeamSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})

export const updateAgentTeamValidator = zValidator("json", updateAgentTeamSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})
