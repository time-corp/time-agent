import { copyArtifactTool } from "./copy-artifact-tool"
import { getUserTool } from "./get-user-tool"
import { listUsersTool } from "./list-users-tool"
import { screenshotTool } from "./screenshot-tool"
import { agentBrowser } from "../browser"

export const defaultAgentTools = {
  listUsers: listUsersTool,
  getUser: getUserTool,
  copyArtifact: copyArtifactTool,
  takeScreenshot: screenshotTool,
  ...agentBrowser.getTools(),
}
