import { Hono } from "hono"
import { ok } from "../../lib/response"
import { slackBotManager } from "../../services/slack-bot-manager"

export const slackRoute = new Hono()
  .get("/status", (c) => ok(c, slackBotManager.getStatus()))
  .post("/start/:channelId", async (c) =>
    ok(c, await slackBotManager.startBot(c.req.param("channelId"))),
  )
  .post("/stop/:channelId", async (c) =>
    ok(c, await slackBotManager.stopBot(c.req.param("channelId"))),
  )
  .post("/restart/:channelId", async (c) =>
    ok(c, await slackBotManager.restartBot(c.req.param("channelId"))),
  )
