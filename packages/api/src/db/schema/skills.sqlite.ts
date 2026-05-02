import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  SKILL_KEY_MAX_LENGTH,
  SKILL_PATH_MAX_LENGTH,
  SKILL_VERSION_MAX_LENGTH,
} from "@time/shared"
import { sqliteBaseColumns } from "./base.sqlite"

export const skills = sqliteTable(
  "skills",
  {
    id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
    key: text("key", { length: SKILL_KEY_MAX_LENGTH }).notNull(),
    name: text("name", { length: NAME_MAX_LENGTH }).notNull(),
    description: text("description", { length: AGENT_DESCRIPTION_MAX_LENGTH }),
    version: text("version", { length: SKILL_VERSION_MAX_LENGTH }).notNull(),
    relativePath: text("relative_path", { length: SKILL_PATH_MAX_LENGTH }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...sqliteBaseColumns(),
  },
  (t) => [unique().on(t.tenantId, t.key)],
)
