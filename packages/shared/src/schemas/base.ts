import { z } from "zod";
import {
  ACTOR_ID_MAX_LENGTH,
  TENANT_ID_MAX_LENGTH,
} from "../constants/field-lengths";

export const entityDateSchema = z.union([z.string(), z.number(), z.date()]);

export const baseEntitySchema = z.object({
  tenantId: z.string().min(1).max(TENANT_ID_MAX_LENGTH),
  createdAt: entityDateSchema,
  createdBy: z.string().min(1).max(ACTOR_ID_MAX_LENGTH),
  updatedAt: entityDateSchema,
  updatedBy: z.string().min(1).max(ACTOR_ID_MAX_LENGTH),
});
