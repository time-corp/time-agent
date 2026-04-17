import type { CreateUserInput } from "@time/shared"

export {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput as CreateUserValues,
  type UpdateUserInput as UpdateUserValues,
} from "@time/shared"

export type UserFormValues = CreateUserInput
