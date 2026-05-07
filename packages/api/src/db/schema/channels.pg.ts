import { boolean, pgTable, varchar } from "drizzle-orm/pg-core"
import {
  ID_MAX_LENGTH,
  CHANNEL_NAME_MAX_LENGTH,
  CHANNEL_TYPE_MAX_LENGTH,
  CONFIG_JSON_MAX_LENGTH,
} from "@time/shared"
import { pgBaseColumns } from "./base.pg"
import { agents } from "./agents.pg"
import { agentTeams } from "./agent-teams.pg"

export const channels = pgTable("channels", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  name: varchar("name", { length: CHANNEL_NAME_MAX_LENGTH }).notNull(),
  type: varchar("type", { length: CHANNEL_TYPE_MAX_LENGTH }).notNull(),
  agentId: varchar("agent_id", { length: ID_MAX_LENGTH }).references(() => agents.id),
  teamId: varchar("team_id", { length: ID_MAX_LENGTH }).references(() => agentTeams.id),
  credentials: varchar("credentials", { length: CONFIG_JSON_MAX_LENGTH }).notNull().default("{}"),
  options: varchar("options", { length: CONFIG_JSON_MAX_LENGTH }).notNull().default("{}"),
  isActive: boolean("is_active").notNull().default(true),
  ...pgBaseColumns(),
})
