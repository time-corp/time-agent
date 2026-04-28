import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  EMAIL_MAX_LENGTH,
  FULLNAME_MAX_LENGTH,
  ID_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from "@time/shared";
import { sqliteBaseColumns } from "./base.sqlite";

export const users = sqliteTable("users", {
  id: text("id", { length: ID_MAX_LENGTH }).primaryKey(),
  username: text("username", { length: USERNAME_MAX_LENGTH }).notNull().unique(),
  email: text("email", { length: EMAIL_MAX_LENGTH }).notNull().unique(),
  password: text("password", { length: PASSWORD_MAX_LENGTH }).notNull(),
  fullname: text("fullname", { length: FULLNAME_MAX_LENGTH }).notNull(),
  ...sqliteBaseColumns(),
});
