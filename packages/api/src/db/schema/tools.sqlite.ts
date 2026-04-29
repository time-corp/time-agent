import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import {
  CONFIG_JSON_MAX_LENGTH,
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  TOOL_CATEGORY_MAX_LENGTH,
  TOOL_KEY_MAX_LENGTH,
  AGENT_DESCRIPTION_MAX_LENGTH,
} from "@time/shared"
import { sql } from "drizzle-orm"

export const tools = sqliteTable("tools", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  key: text("key", { length: TOOL_KEY_MAX_LENGTH }).notNull().unique(),
  name: text("name", { length: NAME_MAX_LENGTH }).notNull(),
  description: text("description", { length: AGENT_DESCRIPTION_MAX_LENGTH }),
  category: text("category", { length: TOOL_CATEGORY_MAX_LENGTH }).notNull(),
  defaultEnabled: integer("default_enabled", { mode: "boolean" }).notNull().default(true),
  requiresApproval: integer("requires_approval", { mode: "boolean" }).notNull().default(false),
  configSchema: text("config_schema", { length: CONFIG_JSON_MAX_LENGTH }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})
