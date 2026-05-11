import type { AuthSession, GatewayLoginInput, SessionUser } from "@time/shared";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "../db";
import { DEFAULT_ACTOR_ID, DEFAULT_TENANT_ID } from "../lib/entity-context";
import { AppError, ErrorCode } from "../lib/errors";
import { createLogger } from "../lib/logger";

const log = createLogger("auth-service");

export const AUTH_COOKIE_NAME = "time_agent_session";
const SYSTEM_USER_ID = process.env["SYSTEM_USER_ID"] ?? "system";
const SYSTEM_GATEWAY_TOKEN = process.env["SYSTEM_GATEWAY_TOKEN"];
const SESSION_TTL_HOURS = Number(process.env["AUTH_SESSION_TTL_HOURS"] ?? "168");
const GATEWAY_LABEL = "system-env";

const toSafeUser = (user: typeof schema.users.$inferSelect): SessionUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const buildPlaceholderPassword = async () =>
  Bun.password.hash(`gateway-only:${crypto.randomUUID()}`);

const createSessionToken = () => `${crypto.randomUUID()}.${crypto.randomUUID()}`;

const buildSessionExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_TTL_HOURS);
  return expiresAt;
};

export const bootstrapSystemGatewayAuth = async () => {
  if (!SYSTEM_GATEWAY_TOKEN) {
    log.warn("SYSTEM_GATEWAY_TOKEN is not configured; gateway login is disabled");
    return;
  }

  const placeholderPassword = await buildPlaceholderPassword();

  await db
    .insert(schema.users)
    .values({
      id: SYSTEM_USER_ID,
      username: SYSTEM_USER_ID,
      email: `${SYSTEM_USER_ID}@local.time-agent`,
      password: placeholderPassword,
      fullname: "System",
      tenantId: DEFAULT_TENANT_ID,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
    })
    .onConflictDoNothing();

  const tokenHash = await sha256(SYSTEM_GATEWAY_TOKEN);
  const existing = await db
    .select()
    .from(schema.gatewayCredentials)
    .where(
      and(
        eq(schema.gatewayCredentials.userId, SYSTEM_USER_ID),
        eq(schema.gatewayCredentials.label, GATEWAY_LABEL),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.gatewayCredentials)
      .set({
        tokenHash,
        isActive: true,
        updatedAt: new Date(),
        updatedBy: DEFAULT_ACTOR_ID,
      })
      .where(eq(schema.gatewayCredentials.id, existing[0].id));
  } else {
    await db.insert(schema.gatewayCredentials).values({
      id: crypto.randomUUID(),
      userId: SYSTEM_USER_ID,
      label: GATEWAY_LABEL,
      tokenHash,
      isActive: true,
      tenantId: DEFAULT_TENANT_ID,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
    });
  }

  log.info({ userId: SYSTEM_USER_ID }, "system gateway credential ready");
};

export const createGatewaySession = async (input: GatewayLoginInput) => {
  if (!SYSTEM_GATEWAY_TOKEN) {
    throw new AppError(
      ErrorCode.AUTH_GATEWAY_TOKEN_NOT_CONFIGURED,
      "Gateway token login is not configured",
      503,
    );
  }

  const [credential] = await db
    .select({
      id: schema.gatewayCredentials.id,
      userId: schema.gatewayCredentials.userId,
      tokenHash: schema.gatewayCredentials.tokenHash,
      isActive: schema.gatewayCredentials.isActive,
      tenantId: schema.gatewayCredentials.tenantId,
      user: schema.users,
    })
    .from(schema.gatewayCredentials)
    .innerJoin(schema.users, eq(schema.users.id, schema.gatewayCredentials.userId))
    .where(eq(schema.gatewayCredentials.userId, input.userId))
    .limit(1);

  if (!credential?.isActive) {
    throw new AppError(
      ErrorCode.AUTH_INVALID_CREDENTIALS,
      "Invalid user ID or gateway token",
      401,
    );
  }

  const incomingHash = await sha256(input.gatewayToken);
  if (incomingHash !== credential.tokenHash) {
    throw new AppError(
      ErrorCode.AUTH_INVALID_CREDENTIALS,
      "Invalid user ID or gateway token",
      401,
    );
  }

  const sessionToken = createSessionToken();
  const sessionTokenHash = await sha256(sessionToken);
  const expiresAt = buildSessionExpiry();

  await db.insert(schema.authSessions).values({
    id: crypto.randomUUID(),
    userId: credential.userId,
    tokenHash: sessionTokenHash,
    expiresAt,
    lastSeenAt: new Date(),
    tenantId: credential.tenantId,
    createdBy: credential.userId,
    updatedBy: credential.userId,
  });

  await db
    .update(schema.gatewayCredentials)
    .set({
      lastUsedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: credential.userId,
    })
    .where(eq(schema.gatewayCredentials.id, credential.id));

  return {
    sessionToken,
    expiresAt,
    user: toSafeUser(credential.user),
  };
};

export const getAuthSession = async (sessionToken: string | undefined | null): Promise<AuthSession> => {
  if (!sessionToken) {
    return { authenticated: false, user: null, expiresAt: null };
  }

  const sessionTokenHash = await sha256(sessionToken);
  const now = new Date();
  const [session] = await db
    .select({
      id: schema.authSessions.id,
      expiresAt: schema.authSessions.expiresAt,
      userId: schema.authSessions.userId,
      user: schema.users,
    })
    .from(schema.authSessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.authSessions.userId))
    .where(
      and(
        eq(schema.authSessions.tokenHash, sessionTokenHash),
        gt(schema.authSessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!session) {
    return { authenticated: false, user: null, expiresAt: null };
  }

  await db
    .update(schema.authSessions)
    .set({
      lastSeenAt: now,
      updatedAt: now,
      updatedBy: session.userId,
    })
    .where(eq(schema.authSessions.id, session.id));

  return {
    authenticated: true,
    user: toSafeUser(session.user),
    expiresAt: session.expiresAt.toISOString(),
  };
};

export const revokeAuthSession = async (sessionToken: string | undefined | null) => {
  if (!sessionToken) return;

  const sessionTokenHash = await sha256(sessionToken);
  await db.delete(schema.authSessions).where(eq(schema.authSessions.tokenHash, sessionTokenHash));
};
