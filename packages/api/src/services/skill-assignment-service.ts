import type { CreateSkillAssignmentInput } from "@time/shared"
import { and, eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"
import { listSkills } from "./skill-registry-service"

export const listSkillAssignments = async (
  targetId: string,
  targetKind: string,
  tenantId = DEFAULT_TENANT_ID,
) => {
  return db
    .select()
    .from(schema.skillAssignments)
    .where(
      and(
        eq(schema.skillAssignments.targetId, targetId),
        eq(schema.skillAssignments.targetKind, targetKind),
        eq(schema.skillAssignments.tenantId, tenantId),
      ),
    )
}

export const listSkillsWithAssignmentState = async (
  targetId: string,
  targetKind: string,
  tenantId = DEFAULT_TENANT_ID,
) => {
  const [allSkills, assignments] = await Promise.all([
    listSkills(),
    listSkillAssignments(targetId, targetKind, tenantId),
  ])

  const assignedNames = new Set(assignments.map((a) => a.skillName))

  return allSkills.map((skill) => ({
    ...skill,
    isAssigned: assignedNames.has(skill.name),
    assignmentId: assignments.find((a) => a.skillName === skill.name)?.id ?? null,
  }))
}

export const createSkillAssignment = async (
  input: CreateSkillAssignmentInput,
  tenantId = DEFAULT_TENANT_ID,
) => {
  const skills = await listSkills()
  const skill = skills.find((s) => s.name === input.skillName)

  if (!skill) {
    throw new AppError(ErrorCode.NOT_FOUND, `Skill "${input.skillName}" not found`, 404)
  }

  const [created] = await db
    .insert(schema.skillAssignments)
    .values({
      id: crypto.randomUUID(),
      targetId: input.targetId,
      targetKind: input.targetKind,
      skillName: input.skillName,
      tenantId,
    })
    .returning()

  return created
}

export const deleteSkillAssignment = async (id: string) => {
  const [deleted] = await db
    .delete(schema.skillAssignments)
    .where(eq(schema.skillAssignments.id, id))
    .returning()

  if (!deleted) {
    throw new AppError(ErrorCode.NOT_FOUND, "Skill assignment not found", 404)
  }

  return { id }
}
