import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@time/shared";
import { sqliteBaseColumns } from "./base.sqlite";
import { users } from "./users.sqlite";

export const gatewayCredentials = sqliteTable("gateway_credentials", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  userId: text("user_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  label: text("label", { length: NAME_MAX_LENGTH }).notNull(),
  tokenHash: text("token_hash", { length: PASSWORD_MAX_LENGTH }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  ...sqliteBaseColumns(),
});
