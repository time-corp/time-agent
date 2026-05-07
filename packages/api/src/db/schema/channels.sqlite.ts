import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import {
  ID_MAX_LENGTH,
  CHANNEL_NAME_MAX_LENGTH,
  CHANNEL_TYPE_MAX_LENGTH,
  CONFIG_JSON_MAX_LENGTH,
} from "@time/shared"
import { sqliteBaseColumns } from "./base.sqlite"
import { agents } from "./agents.sqlite"
import { agentTeams } from "./agent-teams.sqlite"

export const channels = sqliteTable("channels", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  name: text("name", { length: CHANNEL_NAME_MAX_LENGTH }).notNull(),
  type: text("type", { length: CHANNEL_TYPE_MAX_LENGTH }).notNull(),
  agentId: text("agent_id", { length: ID_MAX_LENGTH }).references(() => agents.id),
  teamId: text("team_id", { length: ID_MAX_LENGTH }).references(() => agentTeams.id),
  credentials: text("credentials", { length: CONFIG_JSON_MAX_LENGTH }).notNull().default("{}"),
  options: text("options", { length: CONFIG_JSON_MAX_LENGTH }).notNull().default("{}"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...sqliteBaseColumns(),
})
