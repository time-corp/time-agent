import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { randomUUID } from "node:crypto"
import { copyArtifactFromSandbox } from "../../services/sandbox-artifact-service"

const ARTIFACT_BASE_URL = process.env["ARTIFACT_BASE_URL"] ?? "http://localhost:3000"

export const copyArtifactTool = createTool({
  id: "copy_artifact",
  description: "Copy a file from the sandbox container to host storage and return a public URL. Call this after saving a screenshot or any output file in the sandbox.",
  inputSchema: z.object({
    sandboxPath: z.string().describe("Absolute path of the file inside the sandbox container, e.g. /workspace/tmp/screenshot.png"),
  }),
  outputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
  }),
  execute: async ({ sandboxPath }) => {
    const runId = randomUUID()
    const stored = await copyArtifactFromSandbox(runId, sandboxPath)
    return {
      url: `${ARTIFACT_BASE_URL}/api/v1/artifacts/${runId}/${stored.fileName}`,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
    }
  },
})
