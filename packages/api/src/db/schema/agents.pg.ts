import { boolean, pgTable, varchar } from "drizzle-orm/pg-core"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  AGENT_NAME_MAX_LENGTH,
  CONFIG_JSON_MAX_LENGTH,
  ID_MAX_LENGTH,
  SYSTEM_PROMPT_MAX_LENGTH,
} from "@time/shared"
import { pgBaseColumns } from "./base.pg"
import { models } from "./models.pg"

export const agents = pgTable("agents", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  name: varchar("name", { length: AGENT_NAME_MAX_LENGTH }).notNull(),
  description: varchar("description", { length: AGENT_DESCRIPTION_MAX_LENGTH }),
  modelId: varchar("model_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => models.id),
  systemPrompt: varchar("system_prompt", { length: SYSTEM_PROMPT_MAX_LENGTH }).notNull(),
  toolsConfig: varchar("tools_config", { length: CONFIG_JSON_MAX_LENGTH }).notNull(),
  memoryConfig: varchar("memory_config", { length: CONFIG_JSON_MAX_LENGTH }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...pgBaseColumns(),
})
