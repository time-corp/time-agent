import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { copyArtifactFromSandbox } from "../../services/sandbox-artifact-service";
import { executeShellInSandbox } from "../../services/sandbox-exec-service";

const ARTIFACT_BASE_URL =
  process.env["ARTIFACT_BASE_URL"] ?? "http://localhost:3000";

export const screenshotTool = createTool({
  id: "take_screenshot",
  description:
    "Open a URL in a headless browser inside the sandbox and take a screenshot. Returns a public URL to the image.",
  inputSchema: z.object({
    url: z.string().describe("The full URL to navigate to and screenshot"),
    fullPage: z.boolean().optional().describe("Capture full scrollable page"),
  }),
  outputSchema: z.object({
    url: z.string().describe("Public URL to the screenshot image"),
  }),
  execute: async ({ url, fullPage }) => {
    const runId = randomUUID();
    const sandboxPath = `/tmp/screenshot-${runId}.png`;

    console.log("[screenshot] running inside sandbox, url:", url);

    await executeShellInSandbox(
      `/usr/local/bin/take-screenshot.sh ${JSON.stringify(url)} ${sandboxPath} ${fullPage ?? false}`
    );

    console.log("[screenshot] saved in sandbox:", sandboxPath);

    const stored = await copyArtifactFromSandbox(runId, sandboxPath);
    const artifactUrl = `${ARTIFACT_BASE_URL}/api/v1/artifacts/${runId}/${stored.fileName}`;
    console.log("[screenshot] artifact url:", artifactUrl);
    return { url: artifactUrl };
  },
});
