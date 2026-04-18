import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { agentBrowser } from "../browser";
import { ARTIFACT_STORAGE_DIR } from "../../services/sandbox-artifact-service";

const ARTIFACT_BASE_URL =
  process.env["ARTIFACT_BASE_URL"] ?? "http://localhost:3000";

export const screenshotTool = createTool({
  id: "take_screenshot",
  description:
    "Navigate to a URL and take a screenshot. Returns a public URL to the image.",
  inputSchema: z.object({
    url: z.string().describe("The full URL to navigate to and screenshot"),
    fullPage: z.boolean().optional().describe("Capture full scrollable page"),
  }),
  outputSchema: z.object({
    url: z.string().describe("Public URL to the screenshot image"),
  }),
  execute: async ({ url, fullPage }) => {
    const runId = randomUUID();
    const fileName = `screenshot-${runId}.png`;

    console.log(
      "[screenshot] executablePath:",
      process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"] ?? "(default)",
    );
    console.log("[screenshot] artifactDir:", ARTIFACT_STORAGE_DIR);
    console.log("[screenshot] url:", url);

    try {
      await agentBrowser.ensureReady();
      const manager = await agentBrowser.getManagerForThread();
      const page = manager.getPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const buffer = await page.screenshot({ fullPage: fullPage ?? false });

      const storageDir = resolve(ARTIFACT_STORAGE_DIR, runId);
      await mkdir(storageDir, { recursive: true });
      await writeFile(resolve(storageDir, fileName), buffer);

      console.log("[screenshot] saved:", resolve(storageDir, fileName));
      return {
        url: `${ARTIFACT_BASE_URL}/api/v1/artifacts/${runId}/${fileName}`,
      };
    } catch (err) {
      console.error("[screenshot] error:", err);
      throw err;
    }
  },
});
