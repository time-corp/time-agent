import { z } from "zod";
import { BASE_URL_MAX_LENGTH, ID_MAX_LENGTH, MIME_TYPE_MAX_LENGTH, NAME_MAX_LENGTH } from "../constants/field-lengths";

export const chatHistoryThreadSchema = z.object({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  resourceId: z.string().min(1).max(ID_MAX_LENGTH),
  title: z.string().max(200).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const chatImageArtifactSchema = z.object({
  type: z.enum(["image"]),
  url: z.string().min(1).max(BASE_URL_MAX_LENGTH),
  mimeType: z.string().min(1).max(MIME_TYPE_MAX_LENGTH),
});

export const chatFileArtifactSchema = z.object({
  type: z.enum(["file"]),
  url: z.string().min(1).max(BASE_URL_MAX_LENGTH),
  mimeType: z.string().min(1).max(MIME_TYPE_MAX_LENGTH),
  name: z.string().min(1).max(NAME_MAX_LENGTH),
});

export const chatLinkArtifactSchema = z.object({
  type: z.enum(["link"]),
  url: z.string().min(1).max(BASE_URL_MAX_LENGTH),
  title: z.string().min(1).max(NAME_MAX_LENGTH).optional(),
});

export const chatArtifactSchema = z.discriminatedUnion("type", [
  chatImageArtifactSchema,
  chatFileArtifactSchema,
  chatLinkArtifactSchema,
]);

export const chatAttachmentSchema = chatImageArtifactSchema;

export const chatHistoryMessageSchema = z.object({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  artifacts: z.array(chatArtifactSchema).optional(),
  attachments: z.array(chatAttachmentSchema).optional(),
  createdAt: z.string(),
  traceId: z.string().min(1).max(ID_MAX_LENGTH).optional(),
});

export const chatResponseSchema = z.object({
  text: z.string(),
  artifacts: z.array(chatArtifactSchema).optional(),
  attachments: z.array(chatAttachmentSchema).optional(),
  traceId: z.string().min(1).max(ID_MAX_LENGTH).nullable().optional(),
});

export type ChatHistoryThread = z.infer<typeof chatHistoryThreadSchema>;
export type ChatHistoryMessage = z.infer<typeof chatHistoryMessageSchema>;
export type ChatArtifact = z.infer<typeof chatArtifactSchema>;
export type ChatAttachment = z.infer<typeof chatAttachmentSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
