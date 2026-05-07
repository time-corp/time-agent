import { z } from "zod"
import { baseEntitySchema } from "./base"
import {
  ID_MAX_LENGTH,
  CHANNEL_NAME_MAX_LENGTH,
} from "../constants/field-lengths"

export const channelTypeSchema = z.enum(["telegram", "discord", "slack", "whatsapp", "web", "api"])

export const channelSchema = baseEntitySchema.extend({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  name: z.string().min(1).max(CHANNEL_NAME_MAX_LENGTH),
  type: channelTypeSchema,
  agentId: z.string().max(ID_MAX_LENGTH).nullable(),
  teamId: z.string().max(ID_MAX_LENGTH).nullable(),
  hasCredentials: z.boolean(),
  options: z.record(z.string(), z.unknown()),
  isActive: z.boolean(),
})

export const createChannelSchema = z.object({
  name: z.string().min(1).max(CHANNEL_NAME_MAX_LENGTH),
  type: channelTypeSchema,
  agentId: z
    .string()
    .max(ID_MAX_LENGTH)
    .nullish()
    .transform((v) => v ?? null),
  teamId: z
    .string()
    .max(ID_MAX_LENGTH)
    .nullish()
    .transform((v) => v ?? null),
  credentials: z.record(z.string(), z.unknown()).optional().default({}),
  options: z.record(z.string(), z.unknown()).optional().default({}),
  isActive: z.boolean().optional(),
})

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(CHANNEL_NAME_MAX_LENGTH).optional(),
  agentId: z
    .string()
    .max(ID_MAX_LENGTH)
    .nullish()
    .transform((v) => v ?? null)
    .optional(),
  teamId: z
    .string()
    .max(ID_MAX_LENGTH)
    .nullish()
    .transform((v) => v ?? null)
    .optional(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
})

export type Channel = z.infer<typeof channelSchema>
export type ChannelType = z.infer<typeof channelTypeSchema>
export type CreateChannelInput = z.infer<typeof createChannelSchema>
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>
