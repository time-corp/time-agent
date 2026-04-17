import { Hono } from "hono";
import { resolve } from "node:path";
import { ARTIFACT_STORAGE_DIR } from "../services/sandbox-artifact-service";

export const artifactsRoute = new Hono().get("/:runId/:fileName", async (c) => {
  const { runId, fileName } = c.req.param();

  if (!/^[0-9a-f-]{36}$/.test(runId) || /[/\\]/.test(fileName)) {
    return c.json({ error: "Invalid path" }, 400);
  }

  const filePath = resolve(ARTIFACT_STORAGE_DIR, runId, fileName);
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    return c.json({ error: "Artifact not found" }, 404);
  }

  return new Response(file, {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
