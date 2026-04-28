import { varchar, boolean, pgTable } from "drizzle-orm/pg-core"
import {
  BASE_URL_MAX_LENGTH,
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PROVIDER_TYPE_MAX_LENGTH,
  SECRET_MAX_LENGTH,
} from "@time/shared"
import { pgBaseColumns } from "./base.pg"

export const providers = pgTable("providers", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  name: varchar("name", { length: NAME_MAX_LENGTH }).notNull(),
  type: varchar("type", { length: PROVIDER_TYPE_MAX_LENGTH }).notNull(),
  apiKey: varchar("api_key", { length: SECRET_MAX_LENGTH }),
  baseUrl: varchar("base_url", { length: BASE_URL_MAX_LENGTH }),
  isActive: boolean("is_active").notNull().default(true),
  ...pgBaseColumns(),
})
