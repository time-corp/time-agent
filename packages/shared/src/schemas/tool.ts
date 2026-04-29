import { z } from "zod"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  TARGET_KIND_MAX_LENGTH,
  TOOL_CATEGORY_MAX_LENGTH,
  TOOL_KEY_MAX_LENGTH,
} from "../constants/field-lengths"

export const toolCategorySchema = z.enum(["filesystem", "runtime", "web", "memory", "media"])
export const targetKindSchema = z.enum(["agent", "team", "tenant"])

export const toolSchema = z.object({
  id: z.string().max(ID_MAX_LENGTH),
  key: z.string().max(TOOL_KEY_MAX_LENGTH),
  name: z.string().max(NAME_MAX_LENGTH),
  description: z.string().max(AGENT_DESCRIPTION_MAX_LENGTH).nullable(),
  category: z.string().max(TOOL_CATEGORY_MAX_LENGTH),
  defaultEnabled: z.boolean(),
  requiresApproval: z.boolean(),
  configSchema: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const toolAssignmentSchema = z.object({
  id: z.string().max(ID_MAX_LENGTH),
  targetId: z.string().max(ID_MAX_LENGTH),
  targetKind: z.string().max(TARGET_KIND_MAX_LENGTH),
  toolId: z.string().max(ID_MAX_LENGTH),
  isEnabled: z.boolean(),
  config: z.string().nullable(),
  tenantId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const upsertToolAssignmentSchema = z.object({
  targetId: z.string().min(1).max(ID_MAX_LENGTH),
  targetKind: targetKindSchema,
  toolId: z.string().min(1).max(ID_MAX_LENGTH),
  isEnabled: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
})

export const toolWithEffectiveStateSchema = toolSchema.extend({
  isEnabled: z.boolean(),
  assignmentId: z.string().nullable(),
})

export const skillAssignmentSchema = z.object({
  id: z.string().max(ID_MAX_LENGTH),
  targetId: z.string().max(ID_MAX_LENGTH),
  targetKind: z.string().max(TARGET_KIND_MAX_LENGTH),
  skillName: z.string().max(SKILL_NAME_MAX_LENGTH),
  tenantId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const createSkillAssignmentSchema = z.object({
  targetId: z.string().min(1).max(ID_MAX_LENGTH),
  targetKind: targetKindSchema,
  skillName: z.string().min(1).max(SKILL_NAME_MAX_LENGTH),
})

export type Tool = z.infer<typeof toolSchema>
export type ToolAssignment = z.infer<typeof toolAssignmentSchema>
export type UpsertToolAssignmentInput = z.infer<typeof upsertToolAssignmentSchema>
export type ToolWithEffectiveState = z.infer<typeof toolWithEffectiveStateSchema>
export type TargetKind = z.infer<typeof targetKindSchema>
export type SkillAssignment = z.infer<typeof skillAssignmentSchema>
export type CreateSkillAssignmentInput = z.infer<typeof createSkillAssignmentSchema>
