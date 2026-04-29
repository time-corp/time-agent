import { boolean, pgTable, timestamp, unique, varchar } from "drizzle-orm/pg-core"
import {
  CONFIG_JSON_MAX_LENGTH,
  ID_MAX_LENGTH,
  TARGET_KIND_MAX_LENGTH,
  TENANT_ID_MAX_LENGTH,
} from "@time/shared"
import { tools } from "./tools.pg"

export const toolAssignments = pgTable(
  "tool_assignments",
  {
    id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
    targetId: varchar("target_id", { length: ID_MAX_LENGTH }).notNull(),
    targetKind: varchar("target_kind", { length: TARGET_KIND_MAX_LENGTH }).notNull(),
    toolId: varchar("tool_id", { length: ID_MAX_LENGTH })
      .notNull()
      .references(() => tools.id),
    isEnabled: boolean("is_enabled").notNull().default(true),
    config: varchar("config", { length: CONFIG_JSON_MAX_LENGTH }),
    tenantId: varchar("tenant_id", { length: TENANT_ID_MAX_LENGTH }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.targetId, t.targetKind, t.toolId)],
)
