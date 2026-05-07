import { Hono } from "hono"
import { ok } from "../../lib/response"
import { whatsappBotManager } from "../../services/whatsapp-bot-manager"

export const whatsappRoute = new Hono()
  .get("/status", (c) => ok(c, whatsappBotManager.getStatus()))
  .get("/qr/:channelId", (c) => {
    const qr = whatsappBotManager.getQR(c.req.param("channelId"))
    return ok(c, { qr })
  })
  .post("/start/:channelId", async (c) =>
    ok(c, await whatsappBotManager.startBot(c.req.param("channelId"))),
  )
  .post("/stop/:channelId", async (c) =>
    ok(c, await whatsappBotManager.stopBot(c.req.param("channelId"))),
  )
  .post("/restart/:channelId", async (c) =>
    ok(c, await whatsappBotManager.restartBot(c.req.param("channelId"))),
  )
  .post("/logout/:channelId", async (c) =>
    ok(c, await whatsappBotManager.logoutBot(c.req.param("channelId"))),
  )
