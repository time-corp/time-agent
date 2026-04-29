import { z } from "zod"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  AGENT_NAME_MAX_LENGTH,
  ID_MAX_LENGTH,
  MODEL_NAME_MAX_LENGTH,
  MODEL_SOURCE_MAX_LENGTH,
  SYSTEM_PROMPT_MAX_LENGTH,
} from "../constants/field-lengths"
import { baseEntitySchema } from "./base"

export const jsonObjectSchema = z.record(z.string(), z.unknown())
export const modelSourceSchema = z.enum(["catalog", "custom"])

export const agentConfigSchema = baseEntitySchema.extend({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  name: z.string().min(1).max(AGENT_NAME_MAX_LENGTH),
  description: z.string().max(AGENT_DESCRIPTION_MAX_LENGTH).nullable(),
  providerId: z.string().min(1).max(ID_MAX_LENGTH),
  modelName: z.string().min(1).max(MODEL_NAME_MAX_LENGTH),
  modelSource: modelSourceSchema,
  systemPrompt: z.string().max(SYSTEM_PROMPT_MAX_LENGTH).nullable(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(1),
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
  providerId: z.string().min(1).max(ID_MAX_LENGTH),
  modelName: z.string().min(1).max(MODEL_NAME_MAX_LENGTH),
  modelSource: modelSourceSchema.default("catalog"),
  systemPrompt: z.string().max(SYSTEM_PROMPT_MAX_LENGTH).nullish().transform((v) => v ?? null),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).optional(),
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
  providerId: z.string().min(1).max(ID_MAX_LENGTH).optional(),
  modelName: z.string().min(1).max(MODEL_NAME_MAX_LENGTH).optional(),
  modelSource: modelSourceSchema.optional(),
  systemPrompt: z.string().max(SYSTEM_PROMPT_MAX_LENGTH).nullish().transform((v) => v ?? null).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).optional(),
  toolsConfig: jsonObjectSchema.optional(),
  memoryConfig: jsonObjectSchema.optional(),
  isActive: z.boolean().optional(),
})

export type AgentConfig = z.infer<typeof agentConfigSchema>
export type CreateAgentConfigInput = z.infer<typeof createAgentConfigSchema>
export type UpdateAgentConfigInput = z.infer<typeof updateAgentConfigSchema>
