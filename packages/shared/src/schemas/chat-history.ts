import { z } from "zod";
import { ID_MAX_LENGTH } from "../constants/field-lengths";

export const chatHistoryThreadSchema = z.object({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  resourceId: z.string().min(1).max(ID_MAX_LENGTH),
  title: z.string().max(200).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const chatHistoryMessageSchema = z.object({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  createdAt: z.string(),
  traceId: z.string().min(1).max(ID_MAX_LENGTH).optional(),
});

export type ChatHistoryThread = z.infer<typeof chatHistoryThreadSchema>;
export type ChatHistoryMessage = z.infer<typeof chatHistoryMessageSchema>;
