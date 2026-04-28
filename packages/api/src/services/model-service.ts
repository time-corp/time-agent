import type { CreateModelInput, UpdateModelInput } from "@time/shared"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"

const toPublicModel = (model: typeof schema.models.$inferSelect) => ({
  ...model,
  temperature: model.temperature / 100,
})

export const listModels = async () => {
  const models = await db.select().from(schema.models)
  return models.map(toPublicModel)
}

export const getModelById = async (id: string) => {
  const [model] = await db.select().from(schema.models).where(eq(schema.models.id, id)).limit(1)

  if (!model) {
    throw new AppError(ErrorCode.NOT_FOUND, "Model not found", 404)
  }

  return toPublicModel(model)
}

export const createModel = async (input: CreateModelInput) => {
  const [model] = await db
    .insert(schema.models)
    .values({
      id: crypto.randomUUID(),
      providerId: input.providerId,
      modelName: input.modelName,
      temperature: Math.round((input.temperature ?? 0.7) * 100),
      maxTokens: input.maxTokens ?? 4096,
      isActive: input.isActive ?? true,
      tenantId: DEFAULT_TENANT_ID,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
    })
    .returning()

  if (!model) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create model", 500)
  }

  return toPublicModel(model)
}

export const updateModelById = async (id: string, input: UpdateModelInput) => {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: DEFAULT_ACTOR_ID,
  }

  if (input.providerId !== undefined) updates["providerId"] = input.providerId
  if (input.modelName !== undefined) updates["modelName"] = input.modelName
  if (input.temperature !== undefined) updates["temperature"] = Math.round(input.temperature * 100)
  if (input.maxTokens !== undefined) updates["maxTokens"] = input.maxTokens
  if (input.isActive !== undefined) updates["isActive"] = input.isActive

  const [model] = await db.update(schema.models).set(updates).where(eq(schema.models.id, id)).returning()

  if (!model) {
    throw new AppError(ErrorCode.NOT_FOUND, "Model not found", 404)
  }

  return toPublicModel(model)
}

export const deleteModelById = async (id: string) => {
  const [deleted] = await db.delete(schema.models).where(eq(schema.models.id, id)).returning()

  if (!deleted) {
    throw new AppError(ErrorCode.NOT_FOUND, "Model not found", 404)
  }

  return { id }
}
