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
  modelId: z.string().min(1),
  systemPrompt: z.string().min(1),
  toolsConfig: jsonStringSchema,
  memoryConfig: jsonStringSchema,
  isActive: z.boolean().optional(),
})

export const updateAgentConfigFormSchema = createAgentConfigFormSchema.partial().extend({
  name: z.string().min(1),
  modelId: z.string().min(1),
  systemPrompt: z.string().min(1),
  toolsConfig: jsonStringSchema,
  memoryConfig: jsonStringSchema,
})

export type AgentConfigFormValues = {
  name: string
  description?: string | null
  modelId: string
  systemPrompt: string
  toolsConfig: string
  memoryConfig: string
  isActive?: boolean
}

export type CreateAgentConfigPayload = CreateAgentConfigInput
export type UpdateAgentConfigPayload = UpdateAgentConfigInput
