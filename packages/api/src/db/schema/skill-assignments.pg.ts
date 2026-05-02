import { pgTable, unique, varchar } from "drizzle-orm/pg-core"
import {
  ACTOR_ID_MAX_LENGTH,
  ID_MAX_LENGTH,
  TARGET_KIND_MAX_LENGTH,
  TENANT_ID_MAX_LENGTH,
} from "@time/shared"
import { skills } from "./skills.pg"
import { pgBaseColumns } from "./base.pg"

const baseColumns = pgBaseColumns()

export const skillAssignments = pgTable(
  "skill_assignments",
  {
    id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
    targetId: varchar("target_id", { length: ID_MAX_LENGTH }).notNull(),
    targetKind: varchar("target_kind", { length: TARGET_KIND_MAX_LENGTH }).notNull(),
    skillId: varchar("skill_id", { length: ID_MAX_LENGTH })
      .notNull()
      .references(() => skills.id),
    tenantId: varchar("tenant_id", { length: TENANT_ID_MAX_LENGTH }).notNull(),
    createdAt: baseColumns.createdAt,
    createdBy: varchar("created_by", { length: ACTOR_ID_MAX_LENGTH }).notNull(),
    updatedAt: baseColumns.updatedAt,
    updatedBy: varchar("updated_by", { length: ACTOR_ID_MAX_LENGTH }).notNull(),
  },
  (t) => [unique().on(t.tenantId, t.targetId, t.targetKind, t.skillId)],
)
