import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import {
  ID_MAX_LENGTH,
  MODEL_NAME_MAX_LENGTH,
} from "@time/shared"
import { sqliteBaseColumns } from "./base.sqlite"
import { providers } from "./providers.sqlite"

export const models = sqliteTable("models", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  providerId: text("provider_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => providers.id),
  modelName: text("model_name", { length: MODEL_NAME_MAX_LENGTH }).notNull(),
  temperature: integer("temperature").notNull().default(70),
  maxTokens: integer("max_tokens").notNull().default(4096),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...sqliteBaseColumns(),
})
