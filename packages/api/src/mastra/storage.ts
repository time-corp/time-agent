import type { MastraCompositeStore } from "@mastra/core/storage";
import { LibSQLStore } from "@mastra/libsql";
import { PostgresStore } from "@mastra/pg";
import { AppError, ErrorCode } from "../lib/errors";

const DEFAULT_SQLITE_URL = "file:local.db";
const DEFAULT_POSTGRES_SCHEMA = "mastra";

let storage: MastraCompositeStore | undefined;

const normalizeSqliteUrl = (value?: string) => {
  const url = value?.trim();

  if (!url) {
    return DEFAULT_SQLITE_URL;
  }

  if (
    url === ":memory:" ||
    url.startsWith("file:") ||
    url.startsWith("libsql:")
  ) {
    return url;
  }

  return `file:${url}`;
};

export const getMastraStorage = () => {
  if (storage) {
    return storage;
  }

  const driver = process.env["DB_DRIVER"] ?? "sqlite";
  const disableInit = process.env["MASTRA_STORAGE_DISABLE_INIT"] === "true";

  if (driver === "pg") {
    const connectionString = process.env["DATABASE_URL"];

    if (!connectionString) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "DATABASE_URL is required when DB_DRIVER=pg",
        500,
      );
    }

    storage = new PostgresStore({
      id: "time-agent-mastra-storage",
      connectionString,
      schemaName:
        process.env["MASTRA_STORAGE_SCHEMA"] ?? DEFAULT_POSTGRES_SCHEMA,
      disableInit,
    });

    return storage;
  }

  if (driver === "sqlite") {
    storage = new LibSQLStore({
      id: "time-agent-mastra-storage",
      url: normalizeSqliteUrl(process.env["DATABASE_URL"]),
      disableInit,
    });

    return storage;
  }

  throw new AppError(
    ErrorCode.INTERNAL_ERROR,
    `Unsupported DB_DRIVER for Mastra storage: ${driver}`,
    500,
  );
};
