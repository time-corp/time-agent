import type { CreateChannelInput, UpdateChannelInput } from "@time/shared"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context"
import { AppError, ErrorCode } from "../lib/errors"
import { encryptJson, decryptJson } from "../lib/encryption"

const parseOptions = (raw: string | Record<string, unknown>): Record<string, unknown> => {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return raw
}

const toSafeChannel = (channel: typeof schema.channels.$inferSelect) => {
  const { credentials, ...rest } = channel
  return {
    ...rest,
    options: parseOptions(rest.options as string),
    hasCredentials: credentials !== "{}" && Boolean(credentials),
  }
}

export const listChannels = async () => {
  const channels = await db.select().from(schema.channels)
  return channels.map(toSafeChannel)
}

export const getChannelById = async (id: string) => {
  const [channel] = await db
    .select()
    .from(schema.channels)
    .where(eq(schema.channels.id, id))
    .limit(1)

  if (!channel) {
    throw new AppError(ErrorCode.NOT_FOUND, "Channel not found", 404)
  }

  return toSafeChannel(channel)
}

export const getChannelCredentials = async (id: string) => {
  const [channel] = await db
    .select()
    .from(schema.channels)
    .where(eq(schema.channels.id, id))
    .limit(1)

  if (!channel) {
    throw new AppError(ErrorCode.NOT_FOUND, "Channel not found", 404)
  }

  return decryptJson(channel.credentials as string)
}

export const createChannel = async (input: CreateChannelInput) => {
  const credentials =
    input.credentials && Object.keys(input.credentials).length > 0
      ? await encryptJson(input.credentials)
      : "{}"

  const [channel] = await db
    .insert(schema.channels)
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      type: input.type,
      agentId: input.agentId ?? null,
      teamId: input.teamId ?? null,
      credentials,
      options: JSON.stringify(input.options ?? {}),
      isActive: input.isActive ?? true,
      tenantId: DEFAULT_TENANT_ID,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
    })
    .returning()

  if (!channel) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create channel", 500)
  }

  return toSafeChannel(channel)
}

export const updateChannelById = async (id: string, input: UpdateChannelInput) => {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: DEFAULT_ACTOR_ID,
  }

  if (input.name !== undefined) updates["name"] = input.name
  if (input.agentId !== undefined) updates["agentId"] = input.agentId
  if (input.teamId !== undefined) updates["teamId"] = input.teamId
  if (input.isActive !== undefined) updates["isActive"] = input.isActive
  if (input.options !== undefined) updates["options"] = JSON.stringify(input.options)
  if (input.credentials !== undefined) {
    updates["credentials"] =
      Object.keys(input.credentials).length > 0 ? await encryptJson(input.credentials) : "{}"
  }

  const [channel] = await db
    .update(schema.channels)
    .set(updates)
    .where(eq(schema.channels.id, id))
    .returning()

  if (!channel) {
    throw new AppError(ErrorCode.NOT_FOUND, "Channel not found", 404)
  }

  return toSafeChannel(channel)
}

export const deleteChannelById = async (id: string) => {
  const [deleted] = await db
    .delete(schema.channels)
    .where(eq(schema.channels.id, id))
    .returning()

  if (!deleted) {
    throw new AppError(ErrorCode.NOT_FOUND, "Channel not found", 404)
  }

  return { id }
}
