import { Hono } from "hono"
import { ok } from "../../lib/response"
import {
  createAgentTeam,
  deleteAgentTeamById,
  getAgentTeamById,
  listAgentTeams,
  updateAgentTeamById,
} from "../../services/agent-team-service"
import { createAgentTeamValidator, updateAgentTeamValidator } from "./validator"

export const agentTeamsRoute = new Hono()
  .get("/", async (c) => ok(c, await listAgentTeams()))
  .get("/:id", async (c) => ok(c, await getAgentTeamById(c.req.param("id"))))
  .post("/", createAgentTeamValidator, async (c) =>
    ok(c, await createAgentTeam(c.req.valid("json")), 201)
  )
  .patch("/:id", updateAgentTeamValidator, async (c) =>
    ok(c, await updateAgentTeamById(c.req.param("id"), c.req.valid("json")))
  )
  .delete("/:id", async (c) => ok(c, await deleteAgentTeamById(c.req.param("id"))))
