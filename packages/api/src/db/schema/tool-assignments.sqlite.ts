import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"
import {
  CONFIG_JSON_MAX_LENGTH,
  ID_MAX_LENGTH,
  TARGET_KIND_MAX_LENGTH,
  TENANT_ID_MAX_LENGTH,
} from "@time/shared"
import { sql } from "drizzle-orm"
import { tools } from "./tools.sqlite"

export const toolAssignments = sqliteTable(
  "tool_assignments",
  {
    id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
    targetId: text("target_id", { length: ID_MAX_LENGTH }).notNull(),
    targetKind: text("target_kind", { length: TARGET_KIND_MAX_LENGTH }).notNull(),
    toolId: text("tool_id", { length: ID_MAX_LENGTH })
      .notNull()
      .references(() => tools.id),
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
    config: text("config", { length: CONFIG_JSON_MAX_LENGTH }),
    tenantId: text("tenant_id", { length: TENANT_ID_MAX_LENGTH }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [unique().on(t.targetId, t.targetKind, t.toolId)],
)
