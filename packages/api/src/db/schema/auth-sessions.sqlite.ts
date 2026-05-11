import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  ID_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@time/shared";
import { sqliteBaseColumns } from "./base.sqlite";
import { users } from "./users.sqlite";

export const authSessions = sqliteTable("auth_sessions", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  userId: text("user_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash", { length: PASSWORD_MAX_LENGTH }).notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),
  ...sqliteBaseColumns(),
});
