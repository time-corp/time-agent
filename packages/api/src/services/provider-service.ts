import type { CreateProviderInput, UpdateProviderInput } from "@time/shared"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"

const toSafeProvider = (provider: typeof schema.providers.$inferSelect) => {
  const { apiKey: _apiKey, ...safeProvider } = provider

  return {
    ...safeProvider,
    hasApiKey: Boolean(provider.apiKey),
  }
}

export const listProviders = async () => {
  const providers = await db.select().from(schema.providers)
  return providers.map(toSafeProvider)
}

export const getProviderById = async (id: string) => {
  const [provider] = await db.select().from(schema.providers).where(eq(schema.providers.id, id)).limit(1)

  if (!provider) {
    throw new AppError(ErrorCode.NOT_FOUND, "Provider not found", 404)
  }

  return toSafeProvider(provider)
}

export const createProvider = async (input: CreateProviderInput) => {
  const [provider] = await db
    .insert(schema.providers)
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      type: input.type,
      apiKey: input.apiKey ?? null,
      baseUrl: input.baseUrl ?? null,
      isActive: input.isActive ?? true,
      tenantId: DEFAULT_TENANT_ID,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
    })
    .returning()

  if (!provider) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create provider", 500)
  }

  return toSafeProvider(provider)
}

export const updateProviderById = async (id: string, input: UpdateProviderInput) => {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: DEFAULT_ACTOR_ID,
  }

  if (input.name !== undefined) updates["name"] = input.name
  if (input.type !== undefined) updates["type"] = input.type
  if (input.apiKey !== undefined) updates["apiKey"] = input.apiKey
  if (input.baseUrl !== undefined) updates["baseUrl"] = input.baseUrl
  if (input.isActive !== undefined) updates["isActive"] = input.isActive

  const [provider] = await db
    .update(schema.providers)
    .set(updates)
    .where(eq(schema.providers.id, id))
    .returning()

  if (!provider) {
    throw new AppError(ErrorCode.NOT_FOUND, "Provider not found", 404)
  }

  return toSafeProvider(provider)
}

export const deleteProviderById = async (id: string) => {
  const [deleted] = await db.delete(schema.providers).where(eq(schema.providers.id, id)).returning()

  if (!deleted) {
    throw new AppError(ErrorCode.NOT_FOUND, "Provider not found", 404)
  }

  return { id }
}
