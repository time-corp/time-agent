import { z } from "zod"

export const agentTeamMemberFormSchema = z.object({
  agentId: z.string().min(1, "Agent is required"),
  parentAgentId: z.string().nullable().optional(),
  position: z.coerce.number().int().nullable().optional(),
})

export const createAgentTeamFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  leadAgentId: z.string().min(1, "Lead agent is required"),
  autoOrchestration: z.boolean(),
  isActive: z.boolean().optional(),
  members: z.array(agentTeamMemberFormSchema),
})

export const updateAgentTeamFormSchema = createAgentTeamFormSchema

export type AgentTeamMemberFormValues = z.infer<typeof agentTeamMemberFormSchema>
export type AgentTeamFormValues = z.infer<typeof createAgentTeamFormSchema>
