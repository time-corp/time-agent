import { Mastra } from "@mastra/core";
import { DefaultExporter, Observability, SensitiveDataFilter } from "@mastra/observability";
import { timeAgent } from "./agents/time-agent";
import { getMastraStorage } from "./storage";

export const mastra = new Mastra({
  storage: getMastraStorage(),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "time-agent-api",
        exporters: [new DefaultExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
        logging: {
          enabled: false,
        },
      },
    },
  }),
  agents: {
    timeAgent,
  },
});
