import { Agent } from "@mastra/core/agent";
import { getUserTool } from "../tools/get-user-tool";
import { listUsersTool } from "../tools/list-users-tool";
import { copyArtifactTool } from "../tools/copy-artifact-tool";
import { screenshotTool } from "../tools/screenshot-tool";
import { agentBrowser } from "../browser";

export const timeAgent = new Agent({
  id: "time-agent",
  name: "Time Agent",
  description:
    "A general-purpose assistant that can query users and browse the web.",
  instructions: `
You are the backend assistant for the Time Agent application.

Use the available tools whenever the user asks about users, user records, or profile data.
Only rely on tool results for factual user data.

For browsing, reading, or screenshotting a website:
- Use browser_goto to navigate to the URL
- Use browser_snapshot to read page content (accessibility tree)
- Use browser_screenshot to capture a screenshot
- Chain browser tools as needed (e.g. goto → snapshot → click → snapshot)

If a request is outside the available tools, say so briefly and avoid inventing data.
`,
  model: "openai/gpt-4o-mini",
  tools: {
    listUsers: listUsersTool,
    getUser: getUserTool,
    copyArtifact: copyArtifactTool,
    takeScreenshot: screenshotTool,
    ...agentBrowser.getTools(),
  },
});
