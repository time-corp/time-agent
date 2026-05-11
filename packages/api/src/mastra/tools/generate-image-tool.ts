import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { chatArtifactSchema, chatAttachmentSchema } from "@time/shared"
import { generateImageForAgent } from "../../services/image-generation-service"

export const generateImageTool = createTool({
  id: "generate_image",
  description: "Generate one or more images for a prompt using the configured image-generation agent.",
  inputSchema: z.object({
    agentConfigId: z.string().min(1).describe("The id of the image-generation agent config to use."),
    prompt: z.string().min(1).describe("A clear visual prompt for the requested image."),
  }),
  outputSchema: z.object({
    text: z.string(),
    artifacts: z.array(chatArtifactSchema),
    attachments: z.array(chatAttachmentSchema),
  }),
  execute: async ({ agentConfigId, prompt }) => {
    return generateImageForAgent({ agentConfigId, prompt })
  },
})

export const createBoundGenerateImageTool = (input: {
  agentConfigId: string
  agentName: string
}) =>
  createTool({
    id: `generate_image_${input.agentConfigId}`,
    description: `Generate one or more images with the ${input.agentName} image agent.`,
    inputSchema: z.object({
      prompt: z.string().min(1).describe("A clear visual prompt for the requested image."),
    }),
    outputSchema: z.object({
      text: z.string(),
      artifacts: z.array(chatArtifactSchema),
      attachments: z.array(chatAttachmentSchema),
    }),
    execute: async ({ prompt }) => {
      return generateImageForAgent({ agentConfigId: input.agentConfigId, prompt })
    },
  })
