import type { Agent } from "@mastra/core/agent"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { AppError, ErrorCode } from "../lib/errors"
import { createLogger } from "../lib/logger"
import { getAgentConfigById } from "../services/agent-config-service"
import { createRuntimeAgent } from "./runtime-agent"
import { createBoundGenerateImageTool } from "./tools/generate-image-tool"

const log = createLogger("runtime-team")

const toToolKeySegment = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^[^a-zA-Z]+/, "")

const buildImageToolKey = (agentName: string, index: number, isOnlyTool: boolean) => {
  if (isOnlyTool) return "generateImage"

  const segment = toToolKeySegment(agentName)
  return segment ? `generateImage${segment[0]!.toUpperCase()}${segment.slice(1)}` : `generateImage${index + 1}`
}

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

  const memberConfigs = await Promise.all(
    members.map(async (member) => ({
      member,
      agentConfig: await getAgentConfigById(member.agentId),
    })),
  )

  const imageMembers = memberConfigs.filter(({ agentConfig }) => agentConfig.agentMode === "image_generate")
  const textMembers = memberConfigs.filter(({ agentConfig }) => agentConfig.agentMode !== "image_generate")

  const memberAgentEntries = await Promise.all(
    textMembers.map(async ({ member }) => {
      const { agent } = await createRuntimeAgent(member.agentId)
      return [member.agentId, agent] as [string, Agent]
    }),
  )

  const subAgents = Object.fromEntries(memberAgentEntries)
  const imageToolKeys = imageMembers.map(({ agentConfig }, index) =>
    buildImageToolKey(agentConfig.name, index, imageMembers.length === 1),
  )
  const imageTools = Object.fromEntries(
    imageMembers.map(({ agentConfig }, index) => [
      imageToolKeys[index]!,
      createBoundGenerateImageTool({
        agentConfigId: agentConfig.id,
        agentName: agentConfig.name,
      }),
    ]),
  )

  const { agent: supervisorAgent, modelSettings } = await createRuntimeAgent(
    team.leadAgentId,
    subAgents,
    imageTools,
    {
      hasImageGeneration: imageMembers.length > 0,
      imageToolKeys,
      imageAgentNames: imageMembers.map(({ agentConfig }) => agentConfig.name),
      teamMemberNames: memberConfigs.map(({ agentConfig }) => agentConfig.name),
    },
  )

  log.info({
    leadAgentId: team.leadAgentId,
    subAgentIds: Object.keys(subAgents),
    imageToolKeys: Object.keys(imageTools),
  }, "supervisor ready")

  return { supervisorAgent, modelSettings, team }
}
