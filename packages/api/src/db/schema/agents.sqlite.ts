import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  AGENT_NAME_MAX_LENGTH,
  CONFIG_JSON_MAX_LENGTH,
  ID_MAX_LENGTH,
  MODEL_NAME_MAX_LENGTH,
  MODEL_SOURCE_MAX_LENGTH,
  SYSTEM_PROMPT_MAX_LENGTH,
} from "@time/shared"
import { sqliteBaseColumns } from "./base.sqlite"
import { providers } from "./providers.sqlite"

export const agents = sqliteTable("agents", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  name: text("name", { length: AGENT_NAME_MAX_LENGTH }).notNull(),
  description: text("description", { length: AGENT_DESCRIPTION_MAX_LENGTH }),
  providerId: text("provider_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => providers.id),
  modelName: text("model_name", { length: MODEL_NAME_MAX_LENGTH }).notNull(),
  modelSource: text("model_source", { length: MODEL_SOURCE_MAX_LENGTH }).notNull().default("catalog"),
  systemPrompt: text("system_prompt", { length: SYSTEM_PROMPT_MAX_LENGTH }),
  temperature: integer("temperature").notNull().default(70),
  maxTokens: integer("max_tokens").notNull().default(4096),
  toolsConfig: text("tools_config", { length: CONFIG_JSON_MAX_LENGTH }).notNull(),
  memoryConfig: text("memory_config", { length: CONFIG_JSON_MAX_LENGTH }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...sqliteBaseColumns(),
})
