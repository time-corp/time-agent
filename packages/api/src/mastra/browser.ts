import { AgentBrowser } from "@mastra/agent-browser";

export const agentBrowser = new AgentBrowser({
  headless: true,
  scope: "thread",
  ...(process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"] && {
    executablePath: process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"],
  }),
});
