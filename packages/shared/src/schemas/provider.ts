import { z } from "zod"
import {
  BASE_URL_MAX_LENGTH,
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PROVIDER_TYPE_MAX_LENGTH,
  SECRET_MAX_LENGTH,
} from "../constants/field-lengths"
import { baseEntitySchema } from "./base"

export const providerTypeSchema = z.enum([
  "openai",
  "anthropic",
  "ollama",
  "azure",
  "openai_compatible",
])

const optionalUrlSchema = z
  .string()
  .url()
  .max(BASE_URL_MAX_LENGTH)
  .nullish()
  .transform((value) => value ?? null)

export const providerSchema = baseEntitySchema.extend({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  name: z.string().min(1).max(NAME_MAX_LENGTH),
  type: providerTypeSchema,
  baseUrl: optionalUrlSchema,
  isActive: z.boolean(),
  hasApiKey: z.boolean(),
})

export const createProviderSchema = z.object({
  name: z.string().min(1).max(NAME_MAX_LENGTH),
  type: providerTypeSchema,
  apiKey: z
    .string()
    .min(1)
    .max(SECRET_MAX_LENGTH)
    .nullish()
    .transform((value) => value ?? null),
  baseUrl: optionalUrlSchema.optional(),
  isActive: z.boolean().optional(),
})

export const updateProviderSchema = z.object({
  name: z.string().min(1).max(NAME_MAX_LENGTH).optional(),
  type: providerTypeSchema.optional(),
  apiKey: z
    .string()
    .min(1)
    .max(SECRET_MAX_LENGTH)
    .nullish()
    .transform((value) => value ?? null)
    .optional(),
  baseUrl: optionalUrlSchema.optional(),
  isActive: z.boolean().optional(),
})

export type ProviderType = z.infer<typeof providerTypeSchema>
export type Provider = z.infer<typeof providerSchema>
export type CreateProviderInput = z.infer<typeof createProviderSchema>
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>
