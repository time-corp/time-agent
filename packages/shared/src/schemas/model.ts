import { z } from "zod"
import {
  ID_MAX_LENGTH,
  MODEL_NAME_MAX_LENGTH,
} from "../constants/field-lengths"
import { baseEntitySchema } from "./base"

export const modelSchema = baseEntitySchema.extend({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  providerId: z.string().min(1).max(ID_MAX_LENGTH),
  modelName: z.string().min(1).max(MODEL_NAME_MAX_LENGTH),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(1),
  isActive: z.boolean(),
})

export const createModelSchema = z.object({
  providerId: z.string().min(1).max(ID_MAX_LENGTH),
  modelName: z.string().min(1).max(MODEL_NAME_MAX_LENGTH),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
})

export const updateModelSchema = z.object({
  providerId: z.string().min(1).max(ID_MAX_LENGTH).optional(),
  modelName: z.string().min(1).max(MODEL_NAME_MAX_LENGTH).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
})

export type Model = z.infer<typeof modelSchema>
export type CreateModelInput = z.infer<typeof createModelSchema>
export type UpdateModelInput = z.infer<typeof updateModelSchema>
