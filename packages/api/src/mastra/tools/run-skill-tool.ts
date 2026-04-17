import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { executeSkill } from "../../services/skill-runner-service"

const ARTIFACT_BASE_URL = process.env["ARTIFACT_BASE_URL"] ?? "http://localhost:3000"

export const runSkillTool = createTool({
  id: "run-skill",
  description: "Run a registered skill dynamically and return any produced artifacts.",
  inputSchema: z.object({
    skillName: z.string().min(1).describe("The registered skill name from the skills folder."),
    url: z.string().optional().describe("Target URL for browser-based skills."),
    fullPage: z.boolean().optional().describe("Capture a full-page screenshot when supported."),
    outputName: z.string().min(1).optional().describe("Optional output file name for generated artifacts."),
  }),
  outputSchema: z.object({
    runId: z.string(),
    summary: z.string(),
    artifacts: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(["image", "file"]),
        fileName: z.string(),
        mimeType: z.string(),
        url: z.string(),
      })
    ),
    steps: z.array(
      z.object({
        at: z.string(),
        step: z.string(),
        status: z.enum(["start", "done", "error", "info"]),
        detail: z.record(z.string(), z.unknown()).optional(),
      })
    ),
  }),
  execute: async ({ skillName, url, fullPage, outputName }) => {
    const input: {
      url?: string
      fullPage?: boolean
      outputName?: string
    } = {}

    if (url !== undefined) input.url = url
    if (fullPage !== undefined) input.fullPage = fullPage
    if (outputName !== undefined) input.outputName = outputName

    const result = await executeSkill({ skillName, input })

    return {
      runId: result.runId,
      summary: result.summary,
      artifacts: result.artifacts.map((a) => ({
        id: a.id,
        kind: a.kind,
        fileName: a.fileName,
        mimeType: a.mimeType,
        url: `${ARTIFACT_BASE_URL}/api/v1/artifacts/${result.runId}/${a.fileName}`,
      })),
      steps: result.steps,
    }
  },
})
