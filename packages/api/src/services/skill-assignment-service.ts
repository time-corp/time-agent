import type { CreateSkillAssignmentInput } from "@time/shared"
import { and, eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"
import { assertSkillPathReadable, getSkillById, listSkills } from "./skill-service"

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
    listSkills(tenantId),
    listSkillAssignments(targetId, targetKind, tenantId),
  ])

  const assignmentMap = new Map(assignments.map((a) => [a.skillId, a]))

  return allSkills.map((skill) => ({
    ...skill,
    isAssigned: assignmentMap.has(skill.id),
    assignmentId: assignmentMap.get(skill.id)?.id ?? null,
  }))
}

export const createSkillAssignment = async (
  input: CreateSkillAssignmentInput,
  tenantId = DEFAULT_TENANT_ID,
) => {
  const skill = await getSkillById(input.skillId, tenantId)
  await assertSkillPathReadable(skill.relativePath)

  const [created] = await db
    .insert(schema.skillAssignments)
    .values({
      id: crypto.randomUUID(),
      targetId: input.targetId,
      targetKind: input.targetKind,
      skillId: input.skillId,
      tenantId,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
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

export const resolveAssignedSkillPathsForAgent = async (
  agentId: string,
  tenantId = DEFAULT_TENANT_ID,
) => {
  const rows = await db
    .select({
      id: schema.skills.id,
      key: schema.skills.key,
      relativePath: schema.skills.relativePath,
    })
    .from(schema.skillAssignments)
    .innerJoin(schema.skills, eq(schema.skillAssignments.skillId, schema.skills.id))
    .where(
      and(
        eq(schema.skillAssignments.targetId, agentId),
        eq(schema.skillAssignments.targetKind, "agent"),
        eq(schema.skillAssignments.tenantId, tenantId),
        eq(schema.skills.tenantId, tenantId),
        eq(schema.skills.isActive, true),
      ),
    )

  const deduped = new Map(rows.map((row) => [row.id, row]))

  return Promise.all(
    [...deduped.values()].map(async (row) => ({
      key: row.key,
      path: await assertSkillPathReadable(row.relativePath),
    })),
  )
}
