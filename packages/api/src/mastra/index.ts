import { Mastra } from "@mastra/core";
import { timeAgent } from "./agents/time-agent";
import { getMastraStorage } from "./storage";

export const mastra = new Mastra({
  storage: getMastraStorage(),
  agents: {
    timeAgent,
  },
});
