import { boolean, integer, pgTable, varchar } from "drizzle-orm/pg-core"
import {
  ID_MAX_LENGTH,
  MODEL_NAME_MAX_LENGTH,
} from "@time/shared"
import { pgBaseColumns } from "./base.pg"
import { providers } from "./providers.pg"

export const models = pgTable("models", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  providerId: varchar("provider_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => providers.id),
  modelName: varchar("model_name", { length: MODEL_NAME_MAX_LENGTH }).notNull(),
  temperature: integer("temperature").notNull().default(70),
  maxTokens: integer("max_tokens").notNull().default(4096),
  isActive: boolean("is_active").notNull().default(true),
  ...pgBaseColumns(),
})
