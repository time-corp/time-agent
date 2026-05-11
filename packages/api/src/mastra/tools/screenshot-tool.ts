import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { agentBrowser } from "../browser";
import { ARTIFACT_STORAGE_DIR } from "../../services/sandbox-artifact-service";
import { createLogger } from "../../lib/logger";
import { AppError, ErrorCode } from "../../lib/errors";

const log = createLogger("screenshot");

const ARTIFACT_BASE_URL =
  process.env["ARTIFACT_BASE_URL"] ?? "http://localhost:3000";

const SCREENSHOT_INTENT_PATTERN =
  /\b(screenshot|screen shot|screen capture|capture the screen|visual proof|evidence|compare|comparison|ui bug|layout|viewport|render|look like|appearance)\b/i;

export const screenshotTool = createTool({
  id: "take_screenshot",
  description:
    "Take a screenshot only when the user explicitly requests a screenshot or visual capture. Returns a public URL to the image.",
  inputSchema: z.object({
    url: z.string().describe("The full URL to navigate to before capturing the screenshot"),
    purpose: z.string().min(1).describe("Quote the user's explicit screenshot or visual-capture request in one short sentence."),
    fullPage: z.boolean().optional().describe("Capture the full scrollable page when explicitly needed"),
  }),
  outputSchema: z.object({
    url: z.string().describe("Public URL to the screenshot image"),
  }),
  execute: async ({ url, purpose, fullPage }) => {
    if (!SCREENSHOT_INTENT_PATTERN.test(purpose)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "takeScreenshot may only be used for explicit screenshot or visual-capture requests",
        422,
      );
    }

    const runId = randomUUID();
    const fileName = `screenshot-${runId}.png`;

    log.debug({ executablePath: process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"] ?? "(default)", artifactDir: ARTIFACT_STORAGE_DIR, url, purpose }, "screenshot start");

    try {
      await agentBrowser.ensureReady();
      const manager = await agentBrowser.getManagerForThread();
      const page = manager.getPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const buffer = await page.screenshot({ fullPage: fullPage ?? false });

      const storageDir = resolve(ARTIFACT_STORAGE_DIR, runId);
      await mkdir(storageDir, { recursive: true });
      await writeFile(resolve(storageDir, fileName), buffer);

      log.info({ path: resolve(storageDir, fileName) }, "screenshot saved");
      return {
        url: `${ARTIFACT_BASE_URL}/api/v1/artifacts/${runId}/${fileName}`,
      };
    } catch (err) {
      log.error({ err }, "screenshot failed");
      throw err;
    }
  },
});
