import { boolean, integer, pgTable, varchar } from "drizzle-orm/pg-core"
import { ID_MAX_LENGTH, AGENT_NAME_MAX_LENGTH, AGENT_DESCRIPTION_MAX_LENGTH, SYSTEM_PROMPT_MAX_LENGTH } from "@time/shared"
import { pgBaseColumns } from "./base.pg"
import { agents } from "./agents.pg"

export const agentTeams = pgTable("agent_teams", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  name: varchar("name", { length: AGENT_NAME_MAX_LENGTH }).notNull(),
  description: varchar("description", { length: AGENT_DESCRIPTION_MAX_LENGTH }),
  leadAgentId: varchar("lead_agent_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => agents.id),
  autoOrchestration: boolean("auto_orchestration").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  ...pgBaseColumns(),
})

export const agentTeamMembers = pgTable("agent_team_members", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  teamId: varchar("team_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => agentTeams.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => agents.id),
  parentAgentId: varchar("parent_agent_id", { length: ID_MAX_LENGTH }).references(() => agents.id),
  position: integer("position"),
  ...pgBaseColumns(),
})
