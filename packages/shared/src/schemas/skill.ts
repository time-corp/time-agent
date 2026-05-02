import { z } from "zod"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  SKILL_KEY_MAX_LENGTH,
  SKILL_PATH_MAX_LENGTH,
  SKILL_VERSION_MAX_LENGTH,
  TARGET_KIND_MAX_LENGTH,
} from "../constants/field-lengths"
import { targetKindSchema } from "./tool"

export const skillSchema = z.object({
  id: z.string().max(ID_MAX_LENGTH),
  key: z.string().max(SKILL_KEY_MAX_LENGTH),
  name: z.string().max(NAME_MAX_LENGTH),
  description: z.string().max(AGENT_DESCRIPTION_MAX_LENGTH).nullable(),
  version: z.string().max(SKILL_VERSION_MAX_LENGTH),
  relativePath: z.string().max(SKILL_PATH_MAX_LENGTH),
  isActive: z.boolean(),
  tenantId: z.string().max(ID_MAX_LENGTH),
  createdAt: z.date(),
  createdBy: z.string().max(ID_MAX_LENGTH),
  updatedAt: z.date(),
  updatedBy: z.string().max(ID_MAX_LENGTH),
})

export const skillWithAssignmentStateSchema = skillSchema.extend({
  isAssigned: z.boolean(),
  assignmentId: z.string().nullable(),
})

export const skillAssignmentSchema = z.object({
  id: z.string().max(ID_MAX_LENGTH),
  targetId: z.string().max(ID_MAX_LENGTH),
  targetKind: z.string().max(TARGET_KIND_MAX_LENGTH),
  skillId: z.string().max(ID_MAX_LENGTH),
  tenantId: z.string().max(ID_MAX_LENGTH),
  createdAt: z.date(),
  createdBy: z.string().max(ID_MAX_LENGTH),
  updatedAt: z.date(),
  updatedBy: z.string().max(ID_MAX_LENGTH),
})

export const createSkillAssignmentSchema = z.object({
  targetId: z.string().min(1).max(ID_MAX_LENGTH),
  targetKind: targetKindSchema,
  skillId: z.string().min(1).max(ID_MAX_LENGTH),
})

export const createSkillSchema = z.object({
  key: z.string().min(1).max(SKILL_KEY_MAX_LENGTH),
  name: z.string().min(1).max(NAME_MAX_LENGTH),
  description: z.string().max(AGENT_DESCRIPTION_MAX_LENGTH).nullable().optional(),
  version: z.string().min(1).max(SKILL_VERSION_MAX_LENGTH),
  relativePath: z.string().min(1).max(SKILL_PATH_MAX_LENGTH),
  isActive: z.boolean().optional(),
})

export const uploadSkillResponseSchema = skillSchema

export type Skill = z.infer<typeof skillSchema>
export type SkillWithAssignmentState = z.infer<typeof skillWithAssignmentStateSchema>
export type SkillAssignment = z.infer<typeof skillAssignmentSchema>
export type CreateSkillAssignmentInput = z.infer<typeof createSkillAssignmentSchema>
export type CreateSkillInput = z.infer<typeof createSkillSchema>
