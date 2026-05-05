import { z } from "zod"
import { AGENT_DESCRIPTION_MAX_LENGTH, AGENT_NAME_MAX_LENGTH, ID_MAX_LENGTH } from "../constants/field-lengths"
import { baseEntitySchema } from "./base"

export const agentTeamMemberSchema = baseEntitySchema.extend({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  teamId: z.string().min(1).max(ID_MAX_LENGTH),
  agentId: z.string().min(1).max(ID_MAX_LENGTH),
  parentAgentId: z.string().max(ID_MAX_LENGTH).nullable(),
  position: z.number().int().nullable(),
})

export const agentTeamSchema = baseEntitySchema.extend({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  name: z.string().min(1).max(AGENT_NAME_MAX_LENGTH),
  description: z.string().max(AGENT_DESCRIPTION_MAX_LENGTH).nullable(),
  leadAgentId: z.string().min(1).max(ID_MAX_LENGTH),
  autoOrchestration: z.boolean(),
  isActive: z.boolean(),
  members: z.array(agentTeamMemberSchema).optional(),
})

export const createAgentTeamMemberSchema = z.object({
  agentId: z.string().min(1).max(ID_MAX_LENGTH),
  parentAgentId: z.string().max(ID_MAX_LENGTH).nullish().transform((v) => v ?? null),
  position: z.number().int().nullish().transform((v) => v ?? null),
})

export const createAgentTeamSchema = z.object({
  name: z.string().min(1).max(AGENT_NAME_MAX_LENGTH),
  description: z.string().max(AGENT_DESCRIPTION_MAX_LENGTH).nullish().transform((v) => v ?? null),
  leadAgentId: z.string().min(1).max(ID_MAX_LENGTH),
  autoOrchestration: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
  members: z.array(createAgentTeamMemberSchema).optional().default([]),
})

export const updateAgentTeamSchema = z.object({
  name: z.string().min(1).max(AGENT_NAME_MAX_LENGTH).optional(),
  description: z.string().max(AGENT_DESCRIPTION_MAX_LENGTH).nullish().transform((v) => v ?? null).optional(),
  leadAgentId: z.string().min(1).max(ID_MAX_LENGTH).optional(),
  autoOrchestration: z.boolean().optional(),
  isActive: z.boolean().optional(),
  members: z.array(createAgentTeamMemberSchema).optional(),
})

export type AgentTeamMember = z.infer<typeof agentTeamMemberSchema>
export type AgentTeam = z.infer<typeof agentTeamSchema>
export type CreateAgentTeamInput = z.infer<typeof createAgentTeamSchema>
export type UpdateAgentTeamInput = z.infer<typeof updateAgentTeamSchema>
export type CreateAgentTeamMemberInput = z.infer<typeof createAgentTeamMemberSchema>
