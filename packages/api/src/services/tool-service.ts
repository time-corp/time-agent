import type { UpsertToolAssignmentInput } from "@time/shared"
import { and, eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"

export const listTools = async () => {
  return db.select().from(schema.tools).orderBy(schema.tools.category, schema.tools.name)
}

export const listToolsWithEffectiveState = async (
  targetId: string,
  targetKind: string,
  tenantId = DEFAULT_TENANT_ID,
) => {
  const [allTools, assignments] = await Promise.all([
    db.select().from(schema.tools).orderBy(schema.tools.category, schema.tools.name),
    db
      .select()
      .from(schema.toolAssignments)
      .where(
        and(
          eq(schema.toolAssignments.targetId, targetId),
          eq(schema.toolAssignments.targetKind, targetKind),
          eq(schema.toolAssignments.tenantId, tenantId),
        ),
      ),
  ])

  const assignmentMap = new Map(assignments.map((a) => [a.toolId, a]))

  return allTools.map((tool) => {
    const assignment = assignmentMap.get(tool.id)
    return {
      ...tool,
      isEnabled: assignment ? assignment.isEnabled : tool.defaultEnabled,
      assignmentId: assignment?.id ?? null,
    }
  })
}

export const resolveEnabledKeysForAgent = async (
  agentId: string,
  tenantId = DEFAULT_TENANT_ID,
): Promise<string[]> => {
  const [allTools, tenantAssignments, agentAssignments] = await Promise.all([
    db.select().from(schema.tools),
    db.select().from(schema.toolAssignments).where(
      and(
        eq(schema.toolAssignments.targetId, tenantId),
        eq(schema.toolAssignments.targetKind, "tenant"),
        eq(schema.toolAssignments.tenantId, tenantId),
      ),
    ),
    db.select().from(schema.toolAssignments).where(
      and(
        eq(schema.toolAssignments.targetId, agentId),
        eq(schema.toolAssignments.targetKind, "agent"),
        eq(schema.toolAssignments.tenantId, tenantId),
      ),
    ),
  ])

  const tenantMap = new Map(tenantAssignments.map((a) => [a.toolId, a.isEnabled]))
  const agentMap = new Map(agentAssignments.map((a) => [a.toolId, a.isEnabled]))

  return allTools
    .filter((tool) => {
      // agent assignment wins, then tenant, then default
      if (agentMap.has(tool.id)) return agentMap.get(tool.id)!
      if (tenantMap.has(tool.id)) return tenantMap.get(tool.id)!
      return tool.defaultEnabled
    })
    .map((t) => t.key)
}

export const upsertToolAssignment = async (input: UpsertToolAssignmentInput, tenantId = DEFAULT_TENANT_ID) => {
  const [tool] = await db.select().from(schema.tools).where(eq(schema.tools.id, input.toolId)).limit(1)

  if (!tool) {
    throw new AppError(ErrorCode.NOT_FOUND, "Tool not found", 404)
  }

  const existing = await db
    .select()
    .from(schema.toolAssignments)
    .where(
      and(
        eq(schema.toolAssignments.targetId, input.targetId),
        eq(schema.toolAssignments.targetKind, input.targetKind),
        eq(schema.toolAssignments.toolId, input.toolId),
      ),
    )
    .limit(1)

  const config = input.config ? JSON.stringify(input.config) : null
  const now = new Date()

  if (existing[0]) {
    const [updated] = await db
      .update(schema.toolAssignments)
      .set({ isEnabled: input.isEnabled, config, updatedAt: now })
      .where(eq(schema.toolAssignments.id, existing[0].id))
      .returning()
    return updated
  }

  const [created] = await db
    .insert(schema.toolAssignments)
    .values({
      id: crypto.randomUUID(),
      targetId: input.targetId,
      targetKind: input.targetKind,
      toolId: input.toolId,
      isEnabled: input.isEnabled,
      config,
      tenantId,
    })
    .returning()

  return created
}
