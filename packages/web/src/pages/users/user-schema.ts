import { z } from "zod"

export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullname: z.string().min(1, "Full name is required"),
})

export const updateUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullname: z.string().min(1, "Full name is required"),
})

export type CreateUserValues = z.infer<typeof createUserSchema>
export type UpdateUserValues = z.infer<typeof updateUserSchema>
export type UserFormValues = CreateUserValues
