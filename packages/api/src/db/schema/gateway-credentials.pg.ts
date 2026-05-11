import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import {
  ID_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@time/shared";
import { pgBaseColumns } from "./base.pg";
import { users } from "./users.pg";

export const gatewayCredentials = pgTable("gateway_credentials", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  userId: varchar("user_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  label: varchar("label", { length: NAME_MAX_LENGTH }).notNull(),
  tokenHash: varchar("token_hash", { length: PASSWORD_MAX_LENGTH }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  ...pgBaseColumns(),
});
