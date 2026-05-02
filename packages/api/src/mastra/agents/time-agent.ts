import { Agent } from "@mastra/core/agent";
import { defaultAgentTools } from "../tools";
import { RUNTIME_TOOL_INSTRUCTIONS } from "../instructions";

export const timeAgent = new Agent({
  id: "time-agent",
  name: "Time Agent",
  description:
    "A general-purpose assistant that can query users and browse the web.",
  instructions: RUNTIME_TOOL_INSTRUCTIONS,
  model: "openai/gpt-4o-mini",
  tools: defaultAgentTools,
});
