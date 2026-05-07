import type { Agent } from "@mastra/core/agent"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { AppError, ErrorCode } from "../lib/errors"
import { createLogger } from "../lib/logger"
import { createRuntimeAgent } from "./runtime-agent"

const log = createLogger("runtime-team")

export const createRuntimeTeam = async (teamId: string) => {
  log.debug({ teamId }, "createRuntimeTeam.input")

  const [team] = await db
    .select()
    .from(schema.agentTeams)
    .where(eq(schema.agentTeams.id, teamId))
    .limit(1)

  if (!team) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent team not found", 404)
  }

  if (!team.isActive) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Agent team is inactive", 422)
  }

  const members = await db
    .select()
    .from(schema.agentTeamMembers)
    .where(eq(schema.agentTeamMembers.teamId, teamId))

  log.debug({ id: team.id, name: team.name, leadAgentId: team.leadAgentId, memberCount: members.length }, "team loaded")

  // Create all member agents in parallel
  const memberAgentEntries = await Promise.all(
    members.map(async (member) => {
      const { agent } = await createRuntimeAgent(member.agentId)
      return [member.agentId, agent] as [string, Agent]
    })
  )

  const subAgents = Object.fromEntries(memberAgentEntries)

  // Create lead agent with sub-agents injected
  const { agent: supervisorAgent, modelSettings } = await createRuntimeAgent(
    team.leadAgentId,
    subAgents,
  )

  log.info({ leadAgentId: team.leadAgentId, subAgentIds: Object.keys(subAgents) }, "supervisor ready")

  return { supervisorAgent, modelSettings, team }
}
