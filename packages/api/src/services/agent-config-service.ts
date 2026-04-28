import type { CreateAgentConfigInput, UpdateAgentConfigInput } from "@time/shared"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"

const parseJsonConfig = (value: string) => {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return {}
  }
}

const toPublicAgentConfig = (agent: typeof schema.agents.$inferSelect) => ({
  ...agent,
  toolsConfig: parseJsonConfig(agent.toolsConfig),
  memoryConfig: parseJsonConfig(agent.memoryConfig),
})

export const listAgentConfigs = async () => {
  const agents = await db.select().from(schema.agents)
  return agents.map(toPublicAgentConfig)
}

export const getAgentConfigById = async (id: string) => {
  const [agent] = await db.select().from(schema.agents).where(eq(schema.agents.id, id)).limit(1)

  if (!agent) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent config not found", 404)
  }

  return toPublicAgentConfig(agent)
}

export const createAgentConfig = async (input: CreateAgentConfigInput) => {
  const [agent] = await db
    .insert(schema.agents)
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? null,
      modelId: input.modelId,
      systemPrompt: input.systemPrompt,
      toolsConfig: JSON.stringify(input.toolsConfig ?? {}),
      memoryConfig: JSON.stringify(input.memoryConfig ?? {}),
      isActive: input.isActive ?? true,
      tenantId: DEFAULT_TENANT_ID,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
    })
    .returning()

  if (!agent) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create agent config", 500)
  }

  return toPublicAgentConfig(agent)
}

export const updateAgentConfigById = async (id: string, input: UpdateAgentConfigInput) => {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: DEFAULT_ACTOR_ID,
  }

  if (input.name !== undefined) updates["name"] = input.name
  if (input.description !== undefined) updates["description"] = input.description
  if (input.modelId !== undefined) updates["modelId"] = input.modelId
  if (input.systemPrompt !== undefined) updates["systemPrompt"] = input.systemPrompt
  if (input.toolsConfig !== undefined) updates["toolsConfig"] = JSON.stringify(input.toolsConfig)
  if (input.memoryConfig !== undefined) updates["memoryConfig"] = JSON.stringify(input.memoryConfig)
  if (input.isActive !== undefined) updates["isActive"] = input.isActive

  const [agent] = await db.update(schema.agents).set(updates).where(eq(schema.agents.id, id)).returning()

  if (!agent) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent config not found", 404)
  }

  return toPublicAgentConfig(agent)
}

export const deleteAgentConfigById = async (id: string) => {
  const [deleted] = await db.delete(schema.agents).where(eq(schema.agents.id, id)).returning()

  if (!deleted) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent config not found", 404)
  }

  return { id }
}
