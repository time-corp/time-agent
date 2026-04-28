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
      id VARCHAR(128) PRIMARY KEY NOT NULL,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      fullname VARCHAR(100) NOT NULL,
      tenant_id VARCHAR(128) NOT NULL DEFAULT 'system',
      created_by VARCHAR(128) NOT NULL DEFAULT 'system',
      updated_by VARCHAR(128) NOT NULL DEFAULT 'system',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  const existingColumns = sqlite
    .query("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;
  const existingColumnNames = new Set(existingColumns.map((column) => column.name));

  const missingColumns = [
    {
      name: "tenant_id",
      sql: "ALTER TABLE users ADD COLUMN tenant_id VARCHAR(128) NOT NULL DEFAULT 'system'",
    },
    {
      name: "created_by",
      sql: "ALTER TABLE users ADD COLUMN created_by VARCHAR(128) NOT NULL DEFAULT 'system'",
    },
    {
      name: "updated_by",
      sql: "ALTER TABLE users ADD COLUMN updated_by VARCHAR(128) NOT NULL DEFAULT 'system'",
    },
  ];

  for (const column of missingColumns) {
    if (!existingColumnNames.has(column.name)) {
      sqlite.exec(column.sql);
    }
  }

  return sqlite;
};

// Cast to pg db type — both drivers share the same query API (select/insert/update/delete)
export const db = (
  isPg
    ? drizzlePg(DB_URL!, { schema: pgSchema })
    : drizzleSqlite(createSqliteDatabase(), { schema: sqliteSchema })
) as unknown as BunSQLDatabase<typeof pgSchema>;
