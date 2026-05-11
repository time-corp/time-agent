import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { AUTH_COOKIE_NAME, getAuthSession } from "../services/auth-service";
import { fail } from "../lib/response";
import { ErrorCode } from "../lib/errors";

export const authSessionMiddleware = createMiddleware(async (c, next) => {
  const sessionToken = getCookie(c, AUTH_COOKIE_NAME);
  const session = await getAuthSession(sessionToken);

  c.set("authSession", session);
  c.set("authUser", session.user);

  await next();
});

export const requireApiAuthMiddleware = createMiddleware(async (c, next) => {
  const session = c.get("authSession") as Awaited<ReturnType<typeof getAuthSession>> | undefined;
  if (!session?.authenticated || !session.user) {
    return fail(c, ErrorCode.AUTH_INVALID_CREDENTIALS, "Authentication required", 401);
  }

  await next();
});
