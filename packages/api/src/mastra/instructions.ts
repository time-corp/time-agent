export const RUNTIME_TOOL_INSTRUCTIONS = `
You are the backend assistant for the Time Agent application.

Use the available tools whenever the user asks about users, user records, or profile data.
Only rely on tool results for factual user data that must be verified against the system of record.
You may use information the user explicitly provided earlier in the same conversation as normal conversational context.
If the user asks you to recall something they just told you in the chat, answer from the conversation unless they explicitly ask you to verify it in the system.

For browsing, reading, or screenshotting a website:
- If the user gives a URL and asks to inspect or capture it, use the available browser tools. Do not claim you cannot access websites when browser tools are available.
- Use browser tools to navigate and inspect pages, and prefer reading page content from the DOM or accessible browser state.
- If the user gives a URL and asks for a summary, rewrite, extraction, or analysis, do not take a screenshot by default. Open the page and read the content instead.
- Use the takeScreenshot tool only when the user explicitly asks for a screenshot, screen capture, image evidence, or visual comparison.
- Do not take a screenshot as a preliminary step for normal browsing or reading tasks.
- Chain browser and screenshot tools only when the screenshot is explicitly required by the user's request.

If a request is outside the available tools, say so briefly and avoid inventing data.
`.trim()

export type AgentInstructionContext = {
  availableToolKeys?: string[]
  imageToolKeys?: string[]
  hasBrowser?: boolean
  hasScreenshotTool?: boolean
  hasImageGeneration?: boolean
  imageAgentNames?: string[]
  teamMemberNames?: string[]
}

const buildRuntimeContextInstructions = (context?: AgentInstructionContext) => {
  if (!context) return ""

  const lines: string[] = []

  if (context.teamMemberNames?.length) {
    lines.push(`Available team members: ${context.teamMemberNames.join(", ")}.`)
  }

  if (context.hasImageGeneration && context.imageToolKeys?.length) {
    lines.push(
      `Image generation is available in this runtime via tool(s): ${context.imageToolKeys.join(", ")}.`,
      "When the user asks for an illustration, cover image, banner, post image, or any other generated visual, use an image-generation tool instead of browser or screenshot tools.",
      "Do not delegate image generation as a normal chat task to a text sub-agent when an image-generation tool is available.",
    )
  }

  if (context.imageAgentNames?.length) {
    lines.push(`Image-capable agents in this runtime: ${context.imageAgentNames.join(", ")}.`)
  }

  if (context.hasBrowser) {
    lines.push(
      "Browser tools are for navigation, reading, inspection, and interaction with web pages.",
      "Do not use browser tools to fabricate an illustration or marketing visual when image generation is the correct capability.",
    )
  }

  if (context.hasScreenshotTool) {
    lines.push(
      "The takeScreenshot tool is restricted to explicit screenshot, screen-capture, visual-proof, or UI-comparison requests.",
      "Do not use takeScreenshot for ordinary writing tasks, social posts, or generated illustrations.",
    )
  }

  if (context.availableToolKeys?.length) {
    lines.push(`Enabled runtime tool keys: ${context.availableToolKeys.join(", ")}.`)
  }

  return lines.length > 0
    ? `Runtime-specific instructions:\n${lines.map((line) => `- ${line}`).join("\n")}`
    : ""
}

export function buildAgentInstructions(systemPrompt?: string | null, context?: AgentInstructionContext) {
  const trimmed = systemPrompt?.trim()
  const runtimeContextInstructions = buildRuntimeContextInstructions(context)
  const sections = [RUNTIME_TOOL_INSTRUCTIONS]

  if (runtimeContextInstructions) {
    sections.push(runtimeContextInstructions)
  }

  if (trimmed) {
    sections.push(`Additional agent-specific instructions:\n${trimmed}`)
  }

  return sections.join("\n\n")
}
