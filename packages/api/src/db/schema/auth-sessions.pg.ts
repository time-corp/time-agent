import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import {
  ID_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@time/shared";
import { pgBaseColumns } from "./base.pg";
import { users } from "./users.pg";

export const authSessions = pgTable("auth_sessions", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  userId: varchar("user_id", { length: ID_MAX_LENGTH })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: PASSWORD_MAX_LENGTH }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  lastSeenAt: timestamp("last_seen_at"),
  ...pgBaseColumns(),
});
