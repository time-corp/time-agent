import { Agent } from "@mastra/core/agent";
import { getUserTool } from "../tools/get-user-tool";
import { listUsersTool } from "../tools/list-users-tool";
import { runSkillTool } from "../tools/run-skill-tool";
import { timeAgentWorkspace } from "../workspace";

export const timeAgent = new Agent({
  id: "time-agent",
  name: "Time Agent",
  description: "Answers questions about users using the API's existing services.",
  instructions: `
You are the backend assistant for the Time Agent application.

Use the available tools whenever the user asks about users, user records, or profile data.
Only rely on tool results for factual user data.
When the user asks to open a website or capture a screenshot, use the run-skill tool with a registered browser skill.
If a request is outside the available tools, say so briefly and avoid inventing data.
`,
  model: "openai/gpt-4o-mini",
  workspace: timeAgentWorkspace,
  tools: {
    listUsers: listUsersTool,
    getUser: getUserTool,
    runSkill: runSkillTool,
  },
});
