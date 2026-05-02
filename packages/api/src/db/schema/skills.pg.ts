import { boolean, pgTable, unique, varchar } from "drizzle-orm/pg-core"
import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  SKILL_KEY_MAX_LENGTH,
  SKILL_PATH_MAX_LENGTH,
  SKILL_VERSION_MAX_LENGTH,
} from "@time/shared"
import { pgBaseColumns } from "./base.pg"

export const skills = pgTable(
  "skills",
  {
    id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
    key: varchar("key", { length: SKILL_KEY_MAX_LENGTH }).notNull(),
    name: varchar("name", { length: NAME_MAX_LENGTH }).notNull(),
    description: varchar("description", { length: AGENT_DESCRIPTION_MAX_LENGTH }),
    version: varchar("version", { length: SKILL_VERSION_MAX_LENGTH }).notNull(),
    relativePath: varchar("relative_path", { length: SKILL_PATH_MAX_LENGTH }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...pgBaseColumns(),
  },
  (t) => [unique().on(t.tenantId, t.key)],
)
