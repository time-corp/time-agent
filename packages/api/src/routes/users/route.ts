import { Hono } from "hono";
import { ok } from "../../lib/response";
import {
  createUser,
  deleteUserById,
  getUserById,
  listUsers,
  updateUserById,
} from "../../services/user-service";
import { createUserValidator, updateUserValidator } from "./validator";

export const usersRoute = new Hono()
  .get("/", async (c) => {
    const users = await listUsers();
    return ok(c, users);
  })

  .get("/:id", async (c) => {
    const user = await getUserById(c.req.param("id"));
    return ok(c, user);
  })

  .post("/", createUserValidator, async (c) => {
    const user = await createUser(c.req.valid("json"));
    return ok(c, user, 201);
  })

  .patch("/:id", updateUserValidator, async (c) => {
    const user = await updateUserById(c.req.param("id"), c.req.valid("json"));
    return ok(c, user);
  })

  .delete("/:id", async (c) => {
    const deleted = await deleteUserById(c.req.param("id"));
    return ok(c, deleted);
  });
