import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";
import {
  ACTOR_ID_MAX_LENGTH,
  TENANT_ID_MAX_LENGTH,
} from "@time/shared";

export const sqliteBaseColumns = () => ({
  tenantId: text("tenant_id", { length: TENANT_ID_MAX_LENGTH }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  createdBy: text("created_by", { length: ACTOR_ID_MAX_LENGTH }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedBy: text("updated_by", { length: ACTOR_ID_MAX_LENGTH }).notNull(),
});
