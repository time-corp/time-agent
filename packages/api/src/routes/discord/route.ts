import { Hono } from "hono"
import { ok } from "../../lib/response"
import { discordBotManager } from "../../services/discord-bot-manager"

export const discordRoute = new Hono()
  .get("/status", (c) => ok(c, discordBotManager.getStatus()))
  .post("/start/:channelId", async (c) =>
    ok(c, await discordBotManager.startBot(c.req.param("channelId"))),
  )
  .post("/stop/:channelId", async (c) =>
    ok(c, await discordBotManager.stopBot(c.req.param("channelId"))),
  )
  .post("/restart/:channelId", async (c) =>
    ok(c, await discordBotManager.restartBot(c.req.param("channelId"))),
  )
