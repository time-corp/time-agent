import { Agent } from "@mastra/core/agent"
import type { MastraModelConfig } from "@mastra/core/llm"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"
import { resolveToolsByKeys } from "./tools/registry"
import { resolveEnabledKeysForAgent } from "../services/tool-service"
import { resolveAssignedSkillPathsForAgent } from "../services/skill-assignment-service"
import { createAgentWorkspace } from "./workspace"
import { buildAgentInstructions } from "./instructions"

const parseJsonConfig = (value: string) => {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return {}
  }
}

const resolveProviderModel = (
  provider: typeof schema.providers.$inferSelect,
  modelName: string
): MastraModelConfig => {
  const extras = {
    ...(provider.apiKey != null && { apiKey: provider.apiKey }),
    ...(provider.baseUrl != null && { url: provider.baseUrl }),
  }

  switch (provider.type) {
    case "openai":
      return { id: `openai/${modelName}`, ...extras }
    case "anthropic":
      return { id: `anthropic/${modelName}`, ...extras }
    case "ollama":
      return { id: `ollama/${modelName}`, ...extras }
    case "azure":
      return { id: `openai/${modelName}`, ...extras }
    case "openai_compatible":
      return { id: `openai/${modelName}`, ...extras }
    default:
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Unsupported provider type: ${provider.type}`, 422)
  }
}

export const createRuntimeAgent = async (agentConfigId: string) => {
  const [agentConfig] = await db.select().from(schema.agents).where(eq(schema.agents.id, agentConfigId)).limit(1)

  if (!agentConfig) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent config not found", 404)
  }

  const [provider] = await db.select().from(schema.providers).where(eq(schema.providers.id, agentConfig.providerId)).limit(1)

  if (!provider) {
    throw new AppError(ErrorCode.NOT_FOUND, "Provider not found", 404)
  }

  if (!agentConfig.isActive) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Agent config is inactive", 422)
  }

  if (!provider.isActive) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Provider is inactive", 422)
  }

  const memoryConfig = parseJsonConfig(agentConfig.memoryConfig)

  const [enabledKeys, assignedSkills] = await Promise.all([
    resolveEnabledKeysForAgent(agentConfig.id, DEFAULT_TENANT_ID),
    resolveAssignedSkillPathsForAgent(agentConfig.id, DEFAULT_TENANT_ID),
  ])
  const tools = resolveToolsByKeys(enabledKeys)
  const instructions = buildAgentInstructions(agentConfig.systemPrompt)
  const workspace = createAgentWorkspace(
    agentConfig.id,
    assignedSkills.map((skill) => skill.path),
  )

  console.log("[runtime-agent] agentConfigId:", agentConfig.id)
  console.log("[runtime-agent] providerId:", provider.id)
  console.log("[runtime-agent] model:", `${provider.type}/${agentConfig.modelName}`)
  console.log("[runtime-agent] enabledKeys:", enabledKeys.join(", ") || "(none)")
  console.log("[runtime-agent] runtimeTools:", Object.keys(tools).join(", ") || "(none)")
  console.log(
    "[runtime-agent] instructionsPreview:",
    instructions.slice(0, 400).replace(/\s+/g, " "),
  )

  const agent = new Agent({
    id: `agent-config-${agentConfig.id}`,
    name: agentConfig.name,
    description: agentConfig.description ?? "Runtime agent loaded from database configuration.",
    instructions,
    model: resolveProviderModel(provider, agentConfig.modelName),
    tools,
    workspace,
    rawConfig: {
      memoryConfig,
      agentConfigId: agentConfig.id,
      providerId: provider.id,
      modelName: agentConfig.modelName,
      temperature: agentConfig.temperature / 100,
      maxTokens: agentConfig.maxTokens,
      skills: assignedSkills.map((skill) => skill.key),
    },
  })

  return {
    agent,
    modelSettings: {
      temperature: agentConfig.temperature / 100,
      maxOutputTokens: agentConfig.maxTokens,
    },
  }
}
