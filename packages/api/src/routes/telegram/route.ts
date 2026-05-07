import { Hono } from "hono"
import { ok } from "../../lib/response"
import { telegramBotManager } from "../../services/telegram-bot-manager"

export const telegramRoute = new Hono()
  .get("/status", (c) => ok(c, telegramBotManager.getStatus()))
  .post("/start/:channelId", async (c) =>
    ok(c, await telegramBotManager.startBot(c.req.param("channelId"))),
  )
  .post("/stop/:channelId", async (c) =>
    ok(c, await telegramBotManager.stopBot(c.req.param("channelId"))),
  )
  .post("/restart/:channelId", async (c) =>
    ok(c, await telegramBotManager.restartBot(c.req.param("channelId"))),
  )
