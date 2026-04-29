import { Hono } from "hono"
import { ok } from "../../lib/response"
import {
  createProvider,
  deleteProviderById,
  getProviderById,
  listProviderModels,
  listProviders,
  updateProviderById,
} from "../../services/provider-service"
import { createProviderValidator, updateProviderValidator } from "./validator"

export const providersRoute = new Hono()
  .get("/", async (c) => ok(c, await listProviders()))
  .get("/:id/models", async (c) => ok(c, await listProviderModels(c.req.param("id"))))
  .get("/:id", async (c) => ok(c, await getProviderById(c.req.param("id"))))
  .post("/", createProviderValidator, async (c) => ok(c, await createProvider(c.req.valid("json")), 201))
  .patch("/:id", updateProviderValidator, async (c) =>
    ok(c, await updateProviderById(c.req.param("id"), c.req.valid("json")))
  )
  .delete("/:id", async (c) => ok(c, await deleteProviderById(c.req.param("id"))))
