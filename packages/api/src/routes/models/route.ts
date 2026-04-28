import { Hono } from "hono"
import { ok } from "../../lib/response"
import {
  createModel,
  deleteModelById,
  getModelById,
  listModels,
  updateModelById,
} from "../../services/model-service"
import { createModelValidator, updateModelValidator } from "./validator"

export const modelsRoute = new Hono()
  .get("/", async (c) => ok(c, await listModels()))
  .get("/:id", async (c) => ok(c, await getModelById(c.req.param("id"))))
  .post("/", createModelValidator, async (c) => ok(c, await createModel(c.req.valid("json")), 201))
  .patch("/:id", updateModelValidator, async (c) =>
    ok(c, await updateModelById(c.req.param("id"), c.req.valid("json")))
  )
  .delete("/:id", async (c) => ok(c, await deleteModelById(c.req.param("id"))))
