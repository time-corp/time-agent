import type { users } from "./users.pg";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<
  Omit<
    NewUser,
    "id" | "tenantId" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy"
  >
>;
