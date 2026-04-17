const driver = process.env["DB_DRIVER"] ?? "sqlite";

if (driver !== "pg") {
  console.log("SQLite — skipping database creation");
  process.exit(0);
}

const url = process.env["DATABASE_URL"];
if (!url) {
  console.error("DATABASE_URL is required for DB_DRIVER=pg");
  process.exit(1);
}

const dbName = new URL(url).pathname.slice(1);
const rootUrl = url.replace(`/${dbName}`, "/postgres");

const postgres = (await import("postgres")).default;
const sql = postgres(rootUrl, { max: 1 });

try {
  await sql`CREATE DATABASE ${sql(dbName)}`;
  console.log(`Created database: ${dbName}`);
} catch (e: any) {
  if (e.code === "42P04") console.log(`Database already exists: ${dbName}`);
  else throw e;
} finally {
  await sql.end();
}
