import { varchar, timestamp } from "drizzle-orm/pg-core";
import {
  ACTOR_ID_MAX_LENGTH,
  TENANT_ID_MAX_LENGTH,
} from "@time/shared";

export const pgBaseColumns = () => ({
  tenantId: varchar("tenant_id", { length: TENANT_ID_MAX_LENGTH }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by", { length: ACTOR_ID_MAX_LENGTH }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: ACTOR_ID_MAX_LENGTH }).notNull(),
});
