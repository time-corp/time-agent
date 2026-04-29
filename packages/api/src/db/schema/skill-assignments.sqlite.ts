import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"
import {
  ID_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  TARGET_KIND_MAX_LENGTH,
  TENANT_ID_MAX_LENGTH,
} from "@time/shared"
import { sql } from "drizzle-orm"

export const skillAssignments = sqliteTable(
  "skill_assignments",
  {
    id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
    targetId: text("target_id", { length: ID_MAX_LENGTH }).notNull(),
    targetKind: text("target_kind", { length: TARGET_KIND_MAX_LENGTH }).notNull(),
    skillName: text("skill_name", { length: SKILL_NAME_MAX_LENGTH }).notNull(),
    tenantId: text("tenant_id", { length: TENANT_ID_MAX_LENGTH }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [unique().on(t.targetId, t.targetKind, t.skillName)],
)
