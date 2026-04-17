import { zValidator } from "@hono/zod-validator";
import { createUserSchema, updateUserSchema } from "@time/shared";
import { ErrorCode } from "../../lib/errors";
import { fail } from "../../lib/response";

export const createUserValidator = zValidator("json", createUserSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ");
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400);
  }
});

export const updateUserValidator = zValidator("json", updateUserSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ");
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400);
  }
});
