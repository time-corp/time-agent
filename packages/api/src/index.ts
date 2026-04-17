import { type HonoBindings, type HonoVariables, MastraServer } from "@mastra/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { mastra } from "./mastra";
import { healthRoute } from "./routes/health";
import { sseRoute } from "./routes/sse";
import { wsRoute, websocket } from "./routes/ws";
import { usersRoute } from "./routes/users/route";
import { artifactsRoute } from "./routes/artifacts";
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
  .route(`${apiV1}/users`, usersRoute)
  .route(`${apiV1}/artifacts`, artifactsRoute)
  .onError(errorHandler)
  .notFound(notFoundHandler);

const mastraServer = new MastraServer({
  app,
  mastra,
  prefix: apiV1,
});

await mastraServer.init();

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
  fetch: app.fetch,
  websocket,
};
