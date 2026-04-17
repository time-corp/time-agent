import { drizzle as drizzlePg } from "drizzle-orm/bun-sql";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as pgSchema from "./schema/users.pg";
import * as sqliteSchema from "./schema/users.sqlite";

const isPg = process.env["DB_DRIVER"] === "pg";
const DB_URL = process.env["DATABASE_URL"];

// Use pg schema as canonical type — shape is identical at runtime for both drivers
export const schema = (
  isPg ? pgSchema : sqliteSchema
) as typeof pgSchema;

const createSqliteDatabase = () => {
  const sqlite = new Database(DB_URL ?? "local.db");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      fullname TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  return sqlite;
};

// Cast to pg db type — both drivers share the same query API (select/insert/update/delete)
export const db = (
  isPg
    ? drizzlePg(DB_URL!, { schema: pgSchema })
    : drizzleSqlite(createSqliteDatabase(), { schema: sqliteSchema })
) as unknown as BunSQLDatabase<typeof pgSchema>;
