import { zValidator } from "@hono/zod-validator"
import { upsertToolAssignmentSchema, createSkillAssignmentSchema, createSkillSchema } from "@time/shared"
import { Hono } from "hono"
import { fail, ok } from "../../lib/response"
import { ErrorCode } from "../../lib/errors"
import { listTools, listToolsWithEffectiveState, upsertToolAssignment } from "../../services/tool-service"
import {
  listSkillsWithAssignmentState,
  createSkillAssignment,
  deleteSkillAssignment,
} from "../../services/skill-assignment-service"
import { createSkill, listSkills, uploadSkillArchive } from "../../services/skill-service"

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

const createSkillValidator = zValidator("json", createSkillSchema, (result, c) => {
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

  // List all managed skills (catalog)
  .get("/skills", async (c) => ok(c, await listSkills()))

  // Register a managed skill that already exists on disk
  .post("/skills", createSkillValidator, async (c) =>
    ok(c, await createSkill(c.req.valid("json")), 201)
  )

  // Upload a skill archive and register it as a managed skill
  .post("/skills/upload", async (c) => {
    const formData = await c.req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return fail(c, ErrorCode.VALIDATION_ERROR, "file is required", 400)
    }

    return ok(c, await uploadSkillArchive(file), 201)
  })

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
