import { zValidator } from "@hono/zod-validator";
import { gatewayLoginSchema } from "@time/shared";
import { ErrorCode } from "../../lib/errors";
import { fail } from "../../lib/response";

export const gatewayLoginValidator = zValidator("json", gatewayLoginSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ");
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400);
  }
});
