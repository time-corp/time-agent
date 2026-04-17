import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";

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

// Strip password from response
const safeUser = (user: typeof schema.users.$inferSelect) => {
  const { password: _, ...rest } = user;
  return rest;
};

export const usersRoute = new Hono()
  // GET /users
  .get("/", async (c) => {
    const rows = await db.select().from(schema.users);
    return c.json(rows.map(safeUser));
  })

  // GET /users/:id
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    if (!user) return c.json({ error: "User not found" }, 404);
    return c.json(safeUser(user));
  })

  // POST /users
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const body = c.req.valid("json");
    const id = crypto.randomUUID();
    const hashedPassword = await Bun.password.hash(body.password);

    const [user] = await db
      .insert(schema.users)
      .values({ ...body, id, password: hashedPassword })
      .returning();

    if (!user) return c.json({ error: "Failed to create user" }, 500);
    return c.json(safeUser(user), 201);
  })

  // PATCH /users/:id
  .patch("/:id", zValidator("json", updateUserSchema), async (c) => {
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

    if (!user) return c.json({ error: "User not found" }, 404);
    return c.json(safeUser(user));
  })

  // DELETE /users/:id
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const [deleted] = await db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();

    if (!deleted) return c.json({ error: "User not found" }, 404);
    return c.json({ success: true, id });
  });
