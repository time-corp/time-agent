import { Hono } from "hono"
import { ok } from "../../lib/response"
import {
  createAgentConfig,
  deleteAgentConfigById,
  getAgentConfigById,
  listAgentConfigs,
  updateAgentConfigById,
} from "../../services/agent-config-service"
import { createAgentConfigValidator, updateAgentConfigValidator } from "./validator"

export const agentConfigsRoute = new Hono()
  .get("/", async (c) => ok(c, await listAgentConfigs()))
  .get("/:id", async (c) => ok(c, await getAgentConfigById(c.req.param("id"))))
  .post("/", createAgentConfigValidator, async (c) =>
    ok(c, await createAgentConfig(c.req.valid("json")), 201)
  )
  .patch("/:id", updateAgentConfigValidator, async (c) =>
    ok(c, await updateAgentConfigById(c.req.param("id"), c.req.valid("json")))
  )
  .delete("/:id", async (c) => ok(c, await deleteAgentConfigById(c.req.param("id"))))
