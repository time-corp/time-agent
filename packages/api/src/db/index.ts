import { drizzle as drizzlePg } from "drizzle-orm/bun-sql";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as pgSchema from "./schema/pg";
import * as sqliteSchema from "./schema/sqlite";

const isPg = process.env["DB_DRIVER"] === "pg";
const DB_URL = process.env["DATABASE_URL"];

// Use pg schema as canonical type — shape is identical at runtime for both drivers
export const schema = (
  isPg ? pgSchema : sqliteSchema
) as typeof pgSchema;

const createSqliteDatabase = () => {
  const sqlite = new Database(DB_URL ?? "local.db");
  sqlite.exec("PRAGMA foreign_keys = ON;");

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

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id VARCHAR(128) PRIMARY KEY NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(32) NOT NULL,
      api_key VARCHAR(4096),
      base_url VARCHAR(2048),
      is_active INTEGER NOT NULL DEFAULT 1,
      tenant_id VARCHAR(128) NOT NULL DEFAULT 'system',
      created_by VARCHAR(128) NOT NULL DEFAULT 'system',
      updated_by VARCHAR(128) NOT NULL DEFAULT 'system',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id VARCHAR(128) PRIMARY KEY NOT NULL,
      provider_id VARCHAR(128) NOT NULL REFERENCES providers(id),
      model_name VARCHAR(200) NOT NULL,
      temperature INTEGER NOT NULL DEFAULT 70,
      max_tokens INTEGER NOT NULL DEFAULT 4096,
      is_active INTEGER NOT NULL DEFAULT 1,
      tenant_id VARCHAR(128) NOT NULL DEFAULT 'system',
      created_by VARCHAR(128) NOT NULL DEFAULT 'system',
      updated_by VARCHAR(128) NOT NULL DEFAULT 'system',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id VARCHAR(128) PRIMARY KEY NOT NULL,
      name VARCHAR(120) NOT NULL,
      description VARCHAR(500),
      provider_id VARCHAR(128) NOT NULL REFERENCES providers(id),
      model_name VARCHAR(200) NOT NULL,
      model_source VARCHAR(16) NOT NULL DEFAULT 'catalog',
      system_prompt VARCHAR(20000) NOT NULL,
      temperature INTEGER NOT NULL DEFAULT 70,
      max_tokens INTEGER NOT NULL DEFAULT 4096,
      tools_config VARCHAR(20000) NOT NULL,
      memory_config VARCHAR(20000) NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      tenant_id VARCHAR(128) NOT NULL DEFAULT 'system',
      created_by VARCHAR(128) NOT NULL DEFAULT 'system',
      updated_by VARCHAR(128) NOT NULL DEFAULT 'system',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  const agentColumns = sqlite.query("PRAGMA table_info(agents)").all() as Array<{ name: string }>
  const hasProviderIdColumn = agentColumns.some((column) => column.name === "provider_id")

  if (!hasProviderIdColumn) {
    sqlite.exec(`
      CREATE TABLE agents_v2 (
        id VARCHAR(128) PRIMARY KEY NOT NULL,
        name VARCHAR(120) NOT NULL,
        description VARCHAR(500),
        provider_id VARCHAR(128) NOT NULL REFERENCES providers(id),
        model_name VARCHAR(200) NOT NULL,
        model_source VARCHAR(16) NOT NULL DEFAULT 'catalog',
        system_prompt VARCHAR(20000) NOT NULL,
        temperature INTEGER NOT NULL DEFAULT 70,
        max_tokens INTEGER NOT NULL DEFAULT 4096,
        tools_config VARCHAR(20000) NOT NULL,
        memory_config VARCHAR(20000) NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        tenant_id VARCHAR(128) NOT NULL DEFAULT 'system',
        created_by VARCHAR(128) NOT NULL DEFAULT 'system',
        updated_by VARCHAR(128) NOT NULL DEFAULT 'system',
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `)

    sqlite.exec(`
      INSERT INTO agents_v2 (
        id,
        name,
        description,
        provider_id,
        model_name,
        model_source,
        system_prompt,
        temperature,
        max_tokens,
        tools_config,
        memory_config,
        is_active,
        tenant_id,
        created_by,
        updated_by,
        created_at,
        updated_at
      )
      SELECT
        agents.id,
        agents.name,
        agents.description,
        models.provider_id,
        models.model_name,
        'catalog',
        agents.system_prompt,
        COALESCE(models.temperature, 70),
        COALESCE(models.max_tokens, 4096),
        agents.tools_config,
        agents.memory_config,
        agents.is_active,
        agents.tenant_id,
        agents.created_by,
        agents.updated_by,
        agents.created_at,
        agents.updated_at
      FROM agents
      LEFT JOIN models ON models.id = agents.model_id;
    `)

    sqlite.exec("DROP TABLE agents;")
    sqlite.exec("ALTER TABLE agents_v2 RENAME TO agents;")
  }

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
