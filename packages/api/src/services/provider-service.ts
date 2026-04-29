import type { CreateProviderInput, UpdateProviderInput } from "@time/shared"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"

const providerModelCatalog: Record<
  typeof schema.providers.$inferSelect["type"],
  Array<{ name: string; label: string }>
> = {
  openai: [
    { name: "gpt-4o-mini", label: "gpt-4o-mini" },
    { name: "gpt-4.1-mini", label: "gpt-4.1-mini" },
    { name: "gpt-4.1", label: "gpt-4.1" },
    { name: "o4-mini", label: "o4-mini" },
  ],
  anthropic: [
    { name: "claude-3-5-haiku-latest", label: "claude-3-5-haiku-latest" },
    { name: "claude-3-7-sonnet-latest", label: "claude-3-7-sonnet-latest" },
    { name: "claude-sonnet-4-20250514", label: "claude-sonnet-4-20250514" },
  ],
  ollama: [
    { name: "llama3.1:8b", label: "llama3.1:8b" },
    { name: "qwen2.5:7b", label: "qwen2.5:7b" },
    { name: "mistral:7b", label: "mistral:7b" },
  ],
  azure: [
    { name: "azure-gpt-4o-mini", label: "azure-gpt-4o-mini" },
    { name: "azure-gpt-4o", label: "azure-gpt-4o" },
    { name: "azure-o3-mini", label: "azure-o3-mini" },
  ],
  openai_compatible: [],
}

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

export const listProviderModels = async (id: string) => {
  const [provider] = await db.select().from(schema.providers).where(eq(schema.providers.id, id)).limit(1)

  if (!provider) {
    throw new AppError(ErrorCode.NOT_FOUND, "Provider not found", 404)
  }

  return providerModelCatalog[provider.type] ?? []
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
