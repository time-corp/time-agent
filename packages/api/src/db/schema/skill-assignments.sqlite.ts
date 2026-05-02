import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core"
import {
  ID_MAX_LENGTH,
  TARGET_KIND_MAX_LENGTH,
} from "@time/shared"
import { skills } from "./skills.sqlite"
import { sqliteBaseColumns } from "./base.sqlite"

export const skillAssignments = sqliteTable(
  "skill_assignments",
  {
    id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
    targetId: text("target_id", { length: ID_MAX_LENGTH }).notNull(),
    targetKind: text("target_kind", { length: TARGET_KIND_MAX_LENGTH }).notNull(),
    skillId: text("skill_id", { length: ID_MAX_LENGTH })
      .notNull()
      .references(() => skills.id),
    ...sqliteBaseColumns(),
  },
  (t) => [unique().on(t.tenantId, t.targetId, t.targetKind, t.skillId)],
)
