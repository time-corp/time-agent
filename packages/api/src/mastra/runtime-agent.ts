import { Agent } from "@mastra/core/agent"
import type { MastraModelConfig } from "@mastra/core/llm"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { AppError, ErrorCode } from "../lib/errors"
import { defaultAgentTools } from "./tools"

const parseJsonConfig = (value: string) => {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return {}
  }
}

const resolveProviderModel = (provider: typeof schema.providers.$inferSelect, model: typeof schema.models.$inferSelect): MastraModelConfig => {
  const apiKey = provider.apiKey ?? undefined
  const url = provider.baseUrl ?? undefined

  switch (provider.type) {
    case "openai":
      return { id: `openai/${model.modelName}`, apiKey, url }
    case "anthropic":
      return { id: `anthropic/${model.modelName}`, apiKey, url }
    case "ollama":
      return { id: `ollama/${model.modelName}`, apiKey, url }
    case "azure":
      return { id: `openai/${model.modelName}`, apiKey, url }
    case "openai_compatible":
      return { id: `openai/${model.modelName}`, apiKey, url }
    default:
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Unsupported provider type: ${provider.type}`, 422)
  }
}

export const createRuntimeAgent = async (agentConfigId: string) => {
  const [agentConfig] = await db.select().from(schema.agents).where(eq(schema.agents.id, agentConfigId)).limit(1)

  if (!agentConfig) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent config not found", 404)
  }

  const [model] = await db.select().from(schema.models).where(eq(schema.models.id, agentConfig.modelId)).limit(1)

  if (!model) {
    throw new AppError(ErrorCode.NOT_FOUND, "Model not found", 404)
  }

  const [provider] = await db.select().from(schema.providers).where(eq(schema.providers.id, model.providerId)).limit(1)

  if (!provider) {
    throw new AppError(ErrorCode.NOT_FOUND, "Provider not found", 404)
  }

  if (!agentConfig.isActive) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Agent config is inactive", 422)
  }

  if (!model.isActive) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Model is inactive", 422)
  }

  if (!provider.isActive) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Provider is inactive", 422)
  }

  const toolsConfig = parseJsonConfig(agentConfig.toolsConfig)
  const memoryConfig = parseJsonConfig(agentConfig.memoryConfig)

  return new Agent({
    id: `agent-config-${agentConfig.id}`,
    name: agentConfig.name,
    description: agentConfig.description ?? "Runtime agent loaded from database configuration.",
    instructions: agentConfig.systemPrompt,
    model: resolveProviderModel(provider, model),
    tools: defaultAgentTools,
    rawConfig: {
      toolsConfig,
      memoryConfig,
      agentConfigId: agentConfig.id,
      providerId: provider.id,
      modelId: model.id,
    },
  })
}
