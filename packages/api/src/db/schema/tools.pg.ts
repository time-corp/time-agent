import { boolean, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  CONFIG_JSON_MAX_LENGTH,
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  TOOL_CATEGORY_MAX_LENGTH,
  TOOL_KEY_MAX_LENGTH,
} from "@time/shared"

export const tools = pgTable("tools", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  key: varchar("key", { length: TOOL_KEY_MAX_LENGTH }).notNull().unique(),
  name: varchar("name", { length: NAME_MAX_LENGTH }).notNull(),
  description: varchar("description", { length: AGENT_DESCRIPTION_MAX_LENGTH }),
  category: varchar("category", { length: TOOL_CATEGORY_MAX_LENGTH }).notNull(),
  defaultEnabled: boolean("default_enabled").notNull().default(true),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  configSchema: varchar("config_schema", { length: CONFIG_JSON_MAX_LENGTH }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
