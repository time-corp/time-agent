import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import {
  BASE_URL_MAX_LENGTH,
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PROVIDER_TYPE_MAX_LENGTH,
  SECRET_MAX_LENGTH,
} from "@time/shared"
import { sqliteBaseColumns } from "./base.sqlite"

export const providers = sqliteTable("providers", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  name: text("name", { length: NAME_MAX_LENGTH }).notNull(),
  type: text("type", { length: PROVIDER_TYPE_MAX_LENGTH }).notNull(),
  apiKey: text("api_key", { length: SECRET_MAX_LENGTH }),
  baseUrl: text("base_url", { length: BASE_URL_MAX_LENGTH }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...sqliteBaseColumns(),
})
