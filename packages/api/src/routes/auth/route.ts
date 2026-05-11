import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { ok } from "../../lib/response";
import {
  AUTH_COOKIE_NAME,
  createGatewaySession,
  getAuthSession,
  revokeAuthSession,
} from "../../services/auth-service";
import { gatewayLoginValidator } from "./validator";

const buildCookieOptions = (expiresAt?: Date) => ({
  httpOnly: true,
  sameSite: "Lax" as const,
  secure: process.env["NODE_ENV"] === "production",
  path: "/",
  ...(expiresAt ? { expires: expiresAt } : {}),
});

export const authRoute = new Hono()
  .get("/session", async (c) => {
    const sessionToken = getCookie(c, AUTH_COOKIE_NAME);
    const session = await getAuthSession(sessionToken);
    return ok(c, session);
  })

  .post("/login", gatewayLoginValidator, async (c) => {
    const { sessionToken, expiresAt, user } = await createGatewaySession(c.req.valid("json"));
    setCookie(c, AUTH_COOKIE_NAME, sessionToken, buildCookieOptions(expiresAt));
    return ok(c, {
      authenticated: true,
      user,
      expiresAt: expiresAt.toISOString(),
    });
  })

  .post("/logout", async (c) => {
    const sessionToken = getCookie(c, AUTH_COOKIE_NAME);
    await revokeAuthSession(sessionToken);
    deleteCookie(c, AUTH_COOKIE_NAME, buildCookieOptions());
    return ok(c, {
      authenticated: false,
      user: null,
      expiresAt: null,
    });
  });
