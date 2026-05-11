import type { Tool } from "@mastra/core/tools"
import { agentBrowser } from "../browser"
import { copyArtifactTool } from "./copy-artifact-tool"
import { screenshotTool } from "./screenshot-tool"

type AnyTool = Tool<any, any, any, any, any, any, any>
type ToolEntry = AnyTool | Record<string, AnyTool>

// DB key → one or more runtime tool instances
// "browser" expands to all browser_* tools as a group
const TOOL_REGISTRY: Record<string, ToolEntry> = {
  copy_artifact: copyArtifactTool,
  take_screenshot: screenshotTool,
  browser: agentBrowser.getTools(),
}

export type ResolvedTools = Record<string, AnyTool>

export function resolveToolsByKeys(enabledKeys: string[]): ResolvedTools {
  const result: ResolvedTools = {}

  for (const key of enabledKeys) {
    const entry = TOOL_REGISTRY[key]
    if (!entry) continue

    if (isSingleTool(entry)) {
      const name = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
      result[name] = entry
    } else {
      Object.assign(result, entry)
    }
  }

  return result
}

function isSingleTool(entry: ToolEntry): entry is AnyTool {
  return typeof (entry as AnyTool).execute === "function"
}
