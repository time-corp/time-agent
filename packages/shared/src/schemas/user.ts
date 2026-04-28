import { z } from "zod";
import {
  EMAIL_MAX_LENGTH,
  FULLNAME_MAX_LENGTH,
  ID_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from "../constants/field-lengths";
import { baseEntitySchema } from "./base";

export const userSchema = baseEntitySchema.extend({
  id: z.string().min(1).max(ID_MAX_LENGTH),
  username: z.string().min(3).max(USERNAME_MAX_LENGTH),
  email: z.string().email().max(EMAIL_MAX_LENGTH),
  fullname: z.string().min(1).max(FULLNAME_MAX_LENGTH),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(USERNAME_MAX_LENGTH),
  email: z.string().email().max(EMAIL_MAX_LENGTH),
  password: z.string().min(8).max(PASSWORD_MAX_LENGTH),
  fullname: z.string().min(1).max(FULLNAME_MAX_LENGTH),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(USERNAME_MAX_LENGTH).optional(),
  email: z.string().email().max(EMAIL_MAX_LENGTH).optional(),
  password: z.string().min(8).max(PASSWORD_MAX_LENGTH).optional(),
  fullname: z.string().min(1).max(FULLNAME_MAX_LENGTH).optional(),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
