import { z } from "zod"
import { createProviderSchema, updateProviderSchema } from "@time/shared"

const providerTypeValues = [
  "openai",
  "anthropic",
  "ollama",
  "azure",
  "openai_compatible",
] as const

export const providerTypeOptions = providerTypeValues.map((value) => ({
  value,
  label: value.replaceAll("_", " "),
}))

export const createProviderFormSchema = createProviderSchema.extend({
  apiKey: z.string().optional().nullable(),
  baseUrl: z.string().optional().nullable(),
})

export const updateProviderFormSchema = updateProviderSchema.extend({
  apiKey: z.string().optional().nullable(),
  baseUrl: z.string().optional().nullable(),
})

export type ProviderFormValues = z.infer<typeof createProviderFormSchema>
