import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { AppError, ErrorCode } from "../lib/errors";
import { ok, fail } from "../lib/response";

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  fullname: z.string().min(1).max(100),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  fullname: z.string().min(1).max(100).optional(),
});

const safeUser = (user: typeof schema.users.$inferSelect) => {
  const { password: _, ...rest } = user;
  return rest;
};

const zodFail = zValidator("json", createUserSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400);
  }
});

const zodFailUpdate = zValidator("json", updateUserSchema, (result, c) => {
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    return fail(c, ErrorCode.VALIDATION_ERROR, message, 400);
  }
});

export const usersRoute = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(schema.users);
    return ok(c, rows.map(safeUser));
  })

  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    return ok(c, safeUser(user));
  })

  .post("/", zodFail, async (c) => {
    const body = c.req.valid("json");
    const id = crypto.randomUUID();
    const hashedPassword = await Bun.password.hash(body.password);

    const [user] = await db
      .insert(schema.users)
      .values({ ...body, id, password: hashedPassword })
      .returning();

    if (!user) throw new AppError(ErrorCode.USER_CREATE_FAILED, "Failed to create user", 500);
    return ok(c, safeUser(user), 201);
  })

  .patch("/:id", zodFailUpdate, async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const updates: Record<string, unknown> = { ...body };
    if (body.password) {
      updates["password"] = await Bun.password.hash(body.password);
    }
    updates["updatedAt"] = new Date();

    const [user] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();

    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    return ok(c, safeUser(user));
  })

  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const [deleted] = await db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();

    if (!deleted) throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    return ok(c, { id });
  });
