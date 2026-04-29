import { zValidator } from "@hono/zod-validator"
import { upsertToolAssignmentSchema, createSkillAssignmentSchema } from "@time/shared"
import { Hono } from "hono"
import { fail, ok } from "../../lib/response"
import { ErrorCode } from "../../lib/errors"
import { listTools, listToolsWithEffectiveState, upsertToolAssignment } from "../../services/tool-service"
import {
  listSkillsWithAssignmentState,
  createSkillAssignment,
  deleteSkillAssignment,
} from "../../services/skill-assignment-service"

const upsertAssignmentValidator = zValidator("json", upsertToolAssignmentSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})

const createSkillAssignmentValidator = zValidator("json", createSkillAssignmentSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ")
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400)
  }
})

export const toolsRoute = new Hono()
  // List all tools (catalog)
  .get("/", async (c) => ok(c, await listTools()))

  // List tools with effective state for a target
  .get("/assignments", async (c) => {
    const targetId = c.req.query("targetId")
    const targetKind = c.req.query("targetKind")

    if (!targetId || !targetKind) {
      return fail(c, ErrorCode.VALIDATION_ERROR, "targetId and targetKind are required", 400)
    }

    return ok(c, await listToolsWithEffectiveState(targetId, targetKind))
  })

  // Toggle a tool for a target (upsert)
  .put("/assignments", upsertAssignmentValidator, async (c) =>
    ok(c, await upsertToolAssignment(c.req.valid("json")))
  )

  // List skills with assignment state for a target
  .get("/skill-assignments", async (c) => {
    const targetId = c.req.query("targetId")
    const targetKind = c.req.query("targetKind")

    if (!targetId || !targetKind) {
      return fail(c, ErrorCode.VALIDATION_ERROR, "targetId and targetKind are required", 400)
    }

    return ok(c, await listSkillsWithAssignmentState(targetId, targetKind))
  })

  // Assign a skill to a target
  .post("/skill-assignments", createSkillAssignmentValidator, async (c) =>
    ok(c, await createSkillAssignment(c.req.valid("json")), 201)
  )

  // Unassign a skill
  .delete("/skill-assignments/:id", async (c) =>
    ok(c, await deleteSkillAssignment(c.req.param("id")))
  )
