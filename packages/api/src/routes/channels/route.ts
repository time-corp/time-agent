import { Hono } from "hono"
import { ok } from "../../lib/response"
import {
  createChannel,
  deleteChannelById,
  getChannelById,
  listChannels,
  updateChannelById,
} from "../../services/channel-service"
import { whatsappBotManager } from "../../services/whatsapp-bot-manager"
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
  .delete("/:id", async (c) => {
    const id = c.req.param("id")
    const channel = await getChannelById(id)
    const result = await deleteChannelById(id)
    if (channel.type === "whatsapp") {
      await whatsappBotManager.deleteChannel(id)
    }
    return ok(c, result)
  })
