import { z } from "zod"
import type { CreateAgentConfigInput, UpdateAgentConfigInput } from "@time/shared"

const jsonStringSchema = z.string().refine((value) => {
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
  } catch {
    return false
  }
}, "Must be a valid JSON object")

export const createAgentConfigFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  providerId: z.string().min(1),
  modelName: z.string().min(1),
  modelSource: z.enum(["catalog", "custom"]),
  systemPrompt: z.string().nullable().optional(),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().int().min(1),
  toolsConfig: jsonStringSchema,
  memoryConfig: jsonStringSchema,
  isActive: z.boolean().optional(),
})

export const updateAgentConfigFormSchema = createAgentConfigFormSchema.partial().extend({
  name: z.string().min(1),
  providerId: z.string().min(1),
  modelName: z.string().min(1),
  modelSource: z.enum(["catalog", "custom"]),
  systemPrompt: z.string().nullable().optional(),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().int().min(1),
  toolsConfig: jsonStringSchema,
  memoryConfig: jsonStringSchema,
})

export type AgentConfigFormValues = {
  name: string
  description?: string | null
  providerId: string
  modelName: string
  modelSource: "catalog" | "custom"
  systemPrompt?: string | null
  temperature: number
  maxTokens: number
  toolsConfig: string
  memoryConfig: string
  isActive?: boolean
}

export type CreateAgentConfigPayload = CreateAgentConfigInput
export type UpdateAgentConfigPayload = UpdateAgentConfigInput
