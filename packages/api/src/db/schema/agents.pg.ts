import { boolean, pgTable, varchar } from "drizzle-orm/pg-core"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  AGENT_NAME_MAX_LENGTH,
  CONFIG_JSON_MAX_LENGTH,
  ID_MAX_LENGTH,
  MODEL_NAME_MAX_LENGTH,
  MODEL_SOURCE_MAX_LENGTH,
  SYSTEM_PROMPT_MAX_LENGTH,
} from "@time/shared"
import { pgBaseColumns } from "./base.pg"
import { providers } from "./providers.pg"
import { integer } from "drizzle-orm/pg-core"

export const agents = pgTable("agents", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  name: varchar("name", { length: AGENT_NAME_MAX_LENGTH }).notNull(),
  description: varchar("description", { length: AGENT_DESCRIPTION_MAX_LENGTH }),
  providerId: varchar("provider_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => providers.id),
  modelName: varchar("model_name", { length: MODEL_NAME_MAX_LENGTH }).notNull(),
  modelSource: varchar("model_source", { length: MODEL_SOURCE_MAX_LENGTH }).notNull().default("catalog"),
  systemPrompt: varchar("system_prompt", { length: SYSTEM_PROMPT_MAX_LENGTH }),
  temperature: integer("temperature").notNull().default(70),
  maxTokens: integer("max_tokens").notNull().default(4096),
  toolsConfig: varchar("tools_config", { length: CONFIG_JSON_MAX_LENGTH }).notNull(),
  memoryConfig: varchar("memory_config", { length: CONFIG_JSON_MAX_LENGTH }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...pgBaseColumns(),
})
