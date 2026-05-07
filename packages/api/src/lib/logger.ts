import pino from "pino"
import { join } from "node:path"

const isDev = process.env["NODE_ENV"] !== "production"
const logDir = process.env["LOG_DIR"] ?? join(process.cwd(), "logs")
const logFrequency = process.env["LOG_FREQUENCY"] ?? "daily"
const logSize = process.env["LOG_SIZE"] ?? "20m"

export const logger = pino(
  { level: process.env["LOG_LEVEL"] ?? "info" },
  pino.transport({
    targets: [
      // always write to rotating file
      {
        target: "pino-roll",
        options: {
          file: join(logDir, "api.log"),
          frequency: logFrequency,
          size: logSize,
          mkdir: true,
        },
      },
      // dev: pretty stdout / prod: raw JSON stdout (for Docker)
      isDev
        ? { target: "pino-pretty", options: { colorize: true, ignore: "pid,hostname" } }
        : { target: "pino/file", options: { destination: 1 } },
    ],
  }),
)

export const createLogger = (name: string) => logger.child({ name })
