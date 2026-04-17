import { z } from "zod";

const userDateSchema = z.union([z.string(), z.number(), z.date()]);

export const userSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  fullname: z.string().min(1).max(100),
  createdAt: userDateSchema,
  updatedAt: userDateSchema,
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  fullname: z.string().min(1).max(100),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  fullname: z.string().min(1).max(100).optional(),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
