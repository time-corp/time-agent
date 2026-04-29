import { pgTable, timestamp, unique, varchar } from "drizzle-orm/pg-core"
import {
  ID_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  TARGET_KIND_MAX_LENGTH,
  TENANT_ID_MAX_LENGTH,
} from "@time/shared"

export const skillAssignments = pgTable(
  "skill_assignments",
  {
    id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
    targetId: varchar("target_id", { length: ID_MAX_LENGTH }).notNull(),
    targetKind: varchar("target_kind", { length: TARGET_KIND_MAX_LENGTH }).notNull(),
    skillName: varchar("skill_name", { length: SKILL_NAME_MAX_LENGTH }).notNull(),
    tenantId: varchar("tenant_id", { length: TENANT_ID_MAX_LENGTH }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.targetId, t.targetKind, t.skillName)],
)
