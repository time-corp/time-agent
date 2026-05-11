import { z } from "zod";
import { ID_MAX_LENGTH, SECRET_MAX_LENGTH } from "../constants/field-lengths";
import { userSchema } from "./user";

export const gatewayLoginSchema = z.object({
  userId: z.string().min(1).max(ID_MAX_LENGTH),
  gatewayToken: z.string().min(1).max(SECRET_MAX_LENGTH),
});

export const sessionUserSchema = userSchema.pick({
  id: true,
  username: true,
  email: true,
  fullname: true,
  tenantId: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

export const authSessionSchema = z.object({
  authenticated: z.boolean(),
  user: sessionUserSchema.nullable(),
  expiresAt: z.string().nullable(),
});

export type GatewayLoginInput = z.infer<typeof gatewayLoginSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
