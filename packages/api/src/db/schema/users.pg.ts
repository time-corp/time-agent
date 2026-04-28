import { pgTable, varchar } from "drizzle-orm/pg-core";
import {
  EMAIL_MAX_LENGTH,
  FULLNAME_MAX_LENGTH,
  ID_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from "@time/shared";
import { pgBaseColumns } from "./base.pg";

export const users = pgTable("users", {
  id: varchar("id", { length: ID_MAX_LENGTH }).primaryKey(),
  username: varchar("username", { length: USERNAME_MAX_LENGTH }).notNull().unique(),
  email: varchar("email", { length: EMAIL_MAX_LENGTH }).notNull().unique(),
  password: varchar("password", { length: PASSWORD_MAX_LENGTH }).notNull(),
  fullname: varchar("fullname", { length: FULLNAME_MAX_LENGTH }).notNull(),
  ...pgBaseColumns(),
});
