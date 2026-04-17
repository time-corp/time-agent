import { Mastra } from "@mastra/core";
import { timeAgent } from "./agents/time-agent";

export const mastra = new Mastra({
  agents: {
    timeAgent,
  },
});
