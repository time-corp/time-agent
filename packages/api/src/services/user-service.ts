import type { CreateUserInput, UpdateUserInput } from "@time/shared";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError, ErrorCode } from "../lib/errors";

const DEFAULT_TENANT_ID = "system";
const DEFAULT_ACTOR_ID = "system";

const toSafeUser = (user: typeof schema.users.$inferSelect) => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export const listUsers = async () => {
  const users = await db.select().from(schema.users);
  return users.map(toSafeUser);
};

export const getUserById = async (id: string) => {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);

  if (!user) {
    throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
  }

  return toSafeUser(user);
};

export const createUser = async (input: CreateUserInput) => {
  const id = crypto.randomUUID();
  const hashedPassword = await Bun.password.hash(input.password);

  const [user] = await db
    .insert(schema.users)
    .values({
      ...input,
      id,
      password: hashedPassword,
      tenantId: DEFAULT_TENANT_ID,
      createdBy: DEFAULT_ACTOR_ID,
      updatedBy: DEFAULT_ACTOR_ID,
    })
    .returning();

  if (!user) {
    throw new AppError(ErrorCode.USER_CREATE_FAILED, "Failed to create user", 500);
  }

  return toSafeUser(user);
};

export const updateUserById = async (id: string, input: UpdateUserInput) => {
  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: new Date(),
    updatedBy: DEFAULT_ACTOR_ID,
  };

  if (input.password) {
    updates["password"] = await Bun.password.hash(input.password);
  }

  const [user] = await db
    .update(schema.users)
    .set(updates)
    .where(eq(schema.users.id, id))
    .returning();

  if (!user) {
    throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
  }

  return toSafeUser(user);
};

export const deleteUserById = async (id: string) => {
  const [deleted] = await db
    .delete(schema.users)
    .where(eq(schema.users.id, id))
    .returning();

  if (!deleted) {
    throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
  }

  return { id };
};
