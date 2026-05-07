import { Hono } from "hono"
import { ok } from "../../lib/response"
import {
  createChannel,
  deleteChannelById,
  getChannelById,
  listChannels,
  updateChannelById,
} from "../../services/channel-service"
import { createChannelValidator, updateChannelValidator } from "./validator"

export const channelsRoute = new Hono()
  .get("/", async (c) => ok(c, await listChannels()))
  .get("/:id", async (c) => ok(c, await getChannelById(c.req.param("id"))))
  .post("/", createChannelValidator, async (c) =>
    ok(c, await createChannel(c.req.valid("json")), 201),
  )
  .patch("/:id", updateChannelValidator, async (c) =>
    ok(c, await updateChannelById(c.req.param("id"), c.req.valid("json"))),
  )
  .delete("/:id", async (c) => ok(c, await deleteChannelById(c.req.param("id"))))
