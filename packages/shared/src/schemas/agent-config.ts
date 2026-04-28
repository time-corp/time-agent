import { z } from "zod"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  AGENT_NAME_MAX_LENGTH,
  ID_MAX_LENGTH,
  SYSTEM_PROMPT_MAX_LENGTH,
} from "../constants/field-lengths"
import { baseEntitySchema } from "./base"

export const jsonObjectSchema = z.record(z.string(), z.unknown())

export const agentConfigSchema = baseEntitySchema.extend({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  name: z.string().min(1).max(AGENT_NAME_MAX_LENGTH),
  description: z.string().max(AGENT_DESCRIPTION_MAX_LENGTH).nullable(),
  modelId: z.string().min(1).max(ID_MAX_LENGTH),
  systemPrompt: z.string().min(1).max(SYSTEM_PROMPT_MAX_LENGTH),
  toolsConfig: jsonObjectSchema,
  memoryConfig: jsonObjectSchema,
  isActive: z.boolean(),
})

export const createAgentConfigSchema = z.object({
  name: z.string().min(1).max(AGENT_NAME_MAX_LENGTH),
  description: z
    .string()
    .max(AGENT_DESCRIPTION_MAX_LENGTH)
    .nullish()
    .transform((value) => value ?? null),
  modelId: z.string().min(1).max(ID_MAX_LENGTH),
  systemPrompt: z.string().min(1).max(SYSTEM_PROMPT_MAX_LENGTH),
  toolsConfig: jsonObjectSchema.optional(),
  memoryConfig: jsonObjectSchema.optional(),
  isActive: z.boolean().optional(),
})

export const updateAgentConfigSchema = z.object({
  name: z.string().min(1).max(AGENT_NAME_MAX_LENGTH).optional(),
  description: z
    .string()
    .max(AGENT_DESCRIPTION_MAX_LENGTH)
    .nullish()
    .transform((value) => value ?? null)
    .optional(),
  modelId: z.string().min(1).max(ID_MAX_LENGTH).optional(),
  systemPrompt: z.string().min(1).max(SYSTEM_PROMPT_MAX_LENGTH).optional(),
  toolsConfig: jsonObjectSchema.optional(),
  memoryConfig: jsonObjectSchema.optional(),
  isActive: z.boolean().optional(),
})

export type AgentConfig = z.infer<typeof agentConfigSchema>
export type CreateAgentConfigInput = z.infer<typeof createAgentConfigSchema>
export type UpdateAgentConfigInput = z.infer<typeof updateAgentConfigSchema>
