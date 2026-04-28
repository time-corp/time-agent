import { defineConfig } from "drizzle-kit";

const isPg = process.env["DB_DRIVER"] === "pg";

export default defineConfig({
  dialect: isPg ? "postgresql" : "sqlite",
  schema: isPg
    ? "./src/db/schema/pg.ts"
    : "./src/db/schema/sqlite.ts",
  out: "./drizzle",
  dbCredentials: isPg
    ? { url: process.env["DATABASE_URL"]! }
    : { url: process.env["DATABASE_URL"] ?? "local.db" },
});
