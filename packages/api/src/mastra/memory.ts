import { Memory } from "@mastra/memory";
import type { MemoryConfig } from "@mastra/core/memory";
import { getMastraStorage } from "./storage";

export const createAgentMemory = (options?: Record<string, unknown>) =>
  new Memory({
    storage: getMastraStorage(),
    ...(options && Object.keys(options).length > 0
      ? { options: options as MemoryConfig }
      : {}),
  });
