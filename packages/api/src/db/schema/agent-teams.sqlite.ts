import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { ID_MAX_LENGTH, AGENT_NAME_MAX_LENGTH, AGENT_DESCRIPTION_MAX_LENGTH } from "@time/shared"
import { sqliteBaseColumns } from "./base.sqlite"
import { agents } from "./agents.sqlite"

export const agentTeams = sqliteTable("agent_teams", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  name: text("name", { length: AGENT_NAME_MAX_LENGTH }).notNull(),
  description: text("description", { length: AGENT_DESCRIPTION_MAX_LENGTH }),
  leadAgentId: text("lead_agent_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => agents.id),
  autoOrchestration: integer("auto_orchestration", { mode: "boolean" }).notNull().default(true),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...sqliteBaseColumns(),
})

export const agentTeamMembers = sqliteTable("agent_team_members", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  teamId: text("team_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => agentTeams.id, { onDelete: "cascade" }),
  agentId: text("agent_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => agents.id),
  parentAgentId: text("parent_agent_id", { length: ID_MAX_LENGTH }).references(() => agents.id),
  position: integer("position"),
  ...sqliteBaseColumns(),
})
