import { Hono } from "hono";

export const healthRoute = new Hono().get("/", (c) =>
  c.json({ status: "ok", version: "0.1.0" })
);
