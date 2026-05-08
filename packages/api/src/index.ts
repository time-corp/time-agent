import { type HonoBindings, type HonoVariables, MastraServer } from "@mastra/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { mastra } from "./mastra";
import { channelsRoute } from "./routes/channels/route"
import { telegramRoute } from "./routes/telegram/route"
import { telegramBotManager } from "./services/telegram-bot-manager"
import { discordRoute } from "./routes/discord/route"
import { discordBotManager } from "./services/discord-bot-manager"
import { slackRoute } from "./routes/slack/route"
import { slackBotManager } from "./services/slack-bot-manager"
import { whatsappRoute } from "./routes/whatsapp/route"
import { whatsappBotManager } from "./services/whatsapp-bot-manager"
import { agentConfigsRoute } from "./routes/agent-configs/route"
import { agentTeamsRoute } from "./routes/agent-teams/route"
import { toolsRoute } from "./routes/tools/route"
import { artifactsRoute } from "./routes/artifacts";
import { logsRoute } from "./routes/logs/route"
import { chatRoute } from "./routes/chat/route"
import { chatTeamRoute } from "./routes/chat-team/route"
import { healthRoute } from "./routes/health";
import { providersRoute } from "./routes/providers/route"
import { sseRoute } from "./routes/sse";
import { wsRoute, websocket } from "./routes/ws";
import { terminalRoute } from "./routes/terminal/route";
import { usersRoute } from "./routes/users/route";
import { traceMiddleware } from "./middleware/trace";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

const staticRoot = process.env["STATIC_ROOT"] ?? "/app/web-dist";
const serveWeb = process.env["SERVE_WEB"] === "true";
const apiV1 = "/api/v1";

const app = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables }>()
  .use("*", logger())
  .use("*", cors({ origin: process.env["WEB_URL"] ?? "http://localhost:5173" }))
  .use("*", traceMiddleware)
  .route(`${apiV1}/health`, healthRoute)
  .route(`${apiV1}/sse`, sseRoute)
  .route(`${apiV1}/ws`, wsRoute)
  .route(`${apiV1}/terminal`, terminalRoute)
  .route(`${apiV1}/users`, usersRoute)
  .route(`${apiV1}/providers`, providersRoute)
  .route(`${apiV1}/agent-configs`, agentConfigsRoute)
  .route(`${apiV1}/agent-teams`, agentTeamsRoute)
  .route(`${apiV1}/builtin-tools`, toolsRoute)
  .route(`${apiV1}/chat`, chatRoute)
  .route(`${apiV1}/chat-team`, chatTeamRoute)
  .route(`${apiV1}/artifacts`, artifactsRoute)
  .route(`${apiV1}/logs`, logsRoute)
  .route(`${apiV1}/channels`, channelsRoute)
  .onError(errorHandler)
  .notFound(notFoundHandler);

const mastraServer = new MastraServer({
  app,
  mastra,
  prefix: apiV1,
});

await mastraServer.init();

// Register custom routes AFTER Mastra init to avoid Mastra's wildcard routes shadowing them
app.route(`${apiV1}/telegram`, telegramRoute)
app.route(`${apiV1}/discord`, discordRoute)
app.route(`${apiV1}/slack`, slackRoute)
app.route(`${apiV1}/whatsapp`, whatsappRoute)

// Start all active bots in the background
void telegramBotManager.init()
void discordBotManager.init()
void slackBotManager.init()
void whatsappBotManager.init()

if (serveWeb) {
  app.get("/assets/*", async (c) => {
    const pathname = new URL(c.req.url).pathname;
    const file = Bun.file(`${staticRoot}${pathname}`);

    if (!(await file.exists())) {
      return c.notFound();
    }

    return new Response(file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  });

  app.get("/favicon.ico", async (c) => {
    const file = Bun.file(`${staticRoot}/favicon.ico`);

    if (!(await file.exists())) {
      return c.notFound();
    }

    return new Response(file);
  });

  app.get("*", async (c) => {
    const pathname = new URL(c.req.url).pathname;

    if (pathname.startsWith("/api/")) {
      return c.notFound();
    }

    const indexFile = Bun.file(`${staticRoot}/index.html`);

    if (!(await indexFile.exists())) {
      return c.text(`index.html not found in ${staticRoot}`, 500);
    }

    return new Response(indexFile, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  });
}

export type AppType = typeof app;

export default {
  port: Number(process.env["PORT"] ?? 3000),
  idleTimeout: 255,
  fetch: app.fetch,
  websocket,
};
