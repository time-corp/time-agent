import type { CreateAgentTeamInput, UpdateAgentTeamInput } from "@time/shared"
import { eq, and } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"

const toPublicTeam = (
  team: typeof schema.agentTeams.$inferSelect,
  members: (typeof schema.agentTeamMembers.$inferSelect)[] = []
) => ({ ...team, members })

export const listAgentTeams = async () => {
  const teams = await db.select().from(schema.agentTeams)
  const members = await db.select().from(schema.agentTeamMembers)

  return teams.map((team) =>
    toPublicTeam(
      team,
      members.filter((m) => m.teamId === team.id)
    )
  )
}

export const getAgentTeamById = async (id: string) => {
  const [team] = await db
    .select()
    .from(schema.agentTeams)
    .where(eq(schema.agentTeams.id, id))
    .limit(1)

  if (!team) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent team not found", 404)
  }

  const members = await db
    .select()
    .from(schema.agentTeamMembers)
    .where(eq(schema.agentTeamMembers.teamId, id))

  return toPublicTeam(team, members)
}

export const createAgentTeam = async (input: CreateAgentTeamInput) => {
  const teamId = crypto.randomUUID()

  const [team] = await db
    .insert(schema.agentTeams)
    .values({
      id: teamId,
      name: input.name,
      description: input.description ?? null,
      leadAgentId: input.leadAgentId,
      autoOrchestration: input.autoOrchestration ?? true,
      isActive: input.isActive ?? true,
      tenantId: DEFAULT_TENANT_ID,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
    })
    .returning()

  if (!team) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create agent team", 500)
  }

  const members = input.members ?? []
  if (members.length > 0) {
    await db.insert(schema.agentTeamMembers).values(
      members.map((m) => ({
        id: crypto.randomUUID(),
        teamId,
        agentId: m.agentId,
        parentAgentId: m.parentAgentId ?? null,
        position: m.position ?? null,
        tenantId: DEFAULT_TENANT_ID,
        createdBy: DEFAULT_ACTOR_ID,
        updatedBy: DEFAULT_ACTOR_ID,
      }))
    )
  }

  return getAgentTeamById(teamId)
}

export const updateAgentTeamById = async (id: string, input: UpdateAgentTeamInput) => {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: DEFAULT_ACTOR_ID,
  }

  if (input.name !== undefined) updates["name"] = input.name
  if (input.description !== undefined) updates["description"] = input.description
  if (input.leadAgentId !== undefined) updates["leadAgentId"] = input.leadAgentId
  if (input.autoOrchestration !== undefined) updates["autoOrchestration"] = input.autoOrchestration
  if (input.isActive !== undefined) updates["isActive"] = input.isActive

  const [team] = await db
    .update(schema.agentTeams)
    .set(updates)
    .where(eq(schema.agentTeams.id, id))
    .returning()

  if (!team) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent team not found", 404)
  }

  if (input.members !== undefined) {
    await db
      .delete(schema.agentTeamMembers)
      .where(eq(schema.agentTeamMembers.teamId, id))

    if (input.members.length > 0) {
      await db.insert(schema.agentTeamMembers).values(
        input.members.map((m) => ({
          id: crypto.randomUUID(),
          teamId: id,
          agentId: m.agentId,
          parentAgentId: m.parentAgentId ?? null,
          position: m.position ?? null,
          tenantId: DEFAULT_TENANT_ID,
          createdBy: DEFAULT_ACTOR_ID,
          updatedBy: DEFAULT_ACTOR_ID,
        }))
      )
    }
  }

  return getAgentTeamById(id)
}

export const deleteAgentTeamById = async (id: string) => {
  const [deleted] = await db
    .delete(schema.agentTeams)
    .where(eq(schema.agentTeams.id, id))
    .returning()

  if (!deleted) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent team not found", 404)
  }

  return { id }
}
