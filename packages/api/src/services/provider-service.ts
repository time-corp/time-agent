import type { CreateProviderInput, UpdateProviderInput } from "@time/shared"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"
import { createLogger } from "../lib/logger"

const log = createLogger("provider-service")

const maskSecret = (value: string | null | undefined) => {
  if (!value) return null
  if (value.length <= 8) return "***"
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

const providerModelCatalog: Record<
  typeof schema.providers.$inferSelect["type"],
  Array<{ name: string; label: string }>
> = {
  openai: [
    { name: "gpt-4o", label: "gpt-4o" },
    { name: "gpt-4o-mini", label: "gpt-4o-mini" },
    { name: "gpt-4-turbo", label: "gpt-4-turbo" },
    { name: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
  ],
  anthropic: [
    { name: "claude-sonnet-4-6", label: "claude-sonnet-4-6" },
  ],
  deepseek: [
    { name: "deepseek-chat", label: "deepseek-chat" },
    { name: "deepseek-reasoner", label: "deepseek-reasoner" },
  ],
  gemini: [
    { name: "gemini-3-flash-preview", label: "gemini-3-flash-preview" },
    { name: "gemini-2.0-flash", label: "gemini-2.0-flash" },
    { name: "gemini-2.0-flash-lite", label: "gemini-2.0-flash-lite" },
    { name: "gemini-1.5-pro", label: "gemini-1.5-pro" },
    { name: "gemini-1.5-flash", label: "gemini-1.5-flash" },
  ],
  mistral: [
    { name: "mistral-medium-latest", label: "mistral-medium-latest" },
  ],
  xai: [
    { name: "grok-4-1-fast-non-reasoning", label: "grok-4-1-fast-non-reasoning" },
  ],
  groq: [
    { name: "openai/gpt-oss-120b", label: "openai/gpt-oss-120b" },
  ],
  openrouter: [
    { name: "minimax/minimax-m2.5:free", label: "minimax/minimax-m2.5:free" },
  ],
  ollama: [
    { name: "glm-5.1:cloud", label: "glm-5.1:cloud" },
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

  log.debug({ id: provider.id, name: provider.name, type: provider.type, baseUrl: provider.baseUrl, isActive: provider.isActive, hasApiKey: Boolean(provider.apiKey) }, "getProviderById.result")

  return toSafeProvider(provider)
}

export const listProviderModels = async (id: string) => {
  const [provider] = await db.select().from(schema.providers).where(eq(schema.providers.id, id)).limit(1)

  if (!provider) {
    throw new AppError(ErrorCode.NOT_FOUND, "Provider not found", 404)
  }

  log.debug({ providerId: provider.id, providerName: provider.name, providerType: provider.type, models: providerModelCatalog[provider.type] ?? [] }, "listProviderModels")

  return providerModelCatalog[provider.type] ?? []
}

export const createProvider = async (input: CreateProviderInput) => {
  log.debug({ name: input.name, type: input.type, baseUrl: input.baseUrl ?? null, isActive: input.isActive ?? true, apiKeyPreview: maskSecret(input.apiKey) }, "createProvider.input")

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

  log.info({ id: provider.id, name: provider.name, type: provider.type }, "provider created")

  return toSafeProvider(provider)
}

export const updateProviderById = async (id: string, input: UpdateProviderInput) => {
  log.debug({ id, updates: { ...(input.name !== undefined && { name: input.name }), ...(input.type !== undefined && { type: input.type }), ...(input.baseUrl !== undefined && { baseUrl: input.baseUrl }), ...(input.isActive !== undefined && { isActive: input.isActive }), ...(input.apiKey !== undefined && { apiKeyPreview: maskSecret(input.apiKey) }) } }, "updateProviderById.input")

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

  log.info({ id: provider.id, name: provider.name, type: provider.type }, "provider updated")

  return toSafeProvider(provider)
}

export const deleteProviderById = async (id: string) => {
  const [deleted] = await db.delete(schema.providers).where(eq(schema.providers.id, id)).returning()

  if (!deleted) {
    throw new AppError(ErrorCode.NOT_FOUND, "Provider not found", 404)
  }

  return { id }
}
