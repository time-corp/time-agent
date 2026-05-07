import { Hono } from "hono"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { ok } from "../../lib/response"

const LOG_DIR = process.env["LOG_DIR"] ?? join(process.cwd(), "logs")

const LEVEL_NAMES: Record<number, string> = {
  10: "trace",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal",
}

const LEVEL_BY_NAME: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
}

async function readLogEntries() {
  let files: string[] = []
  try {
    const all = await readdir(LOG_DIR)
    files = all.filter((f) => f.endsWith(".log")).map((f) => join(LOG_DIR, f))
  } catch {
    return []
  }

  const entries: Record<string, unknown>[] = []

  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          const entry = JSON.parse(trimmed) as Record<string, unknown>
          entries.push({
            ...entry,
            levelName: LEVEL_NAMES[entry["level"] as number] ?? "unknown",
          })
        } catch {
          // skip malformed lines
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  entries.sort((a, b) => (b["time"] as number) - (a["time"] as number))
  return entries
}

export const logsRoute = new Hono()
  .get("/", async (c) => {
    const limit = Math.min(Number(c.req.query("limit") ?? 100), 500)
    const offset = Number(c.req.query("offset") ?? 0)
    const levelFilter = c.req.query("level")
    const search = c.req.query("search")?.toLowerCase()

    let entries = await readLogEntries()

    if (levelFilter && levelFilter !== "all") {
      const minLevel = LEVEL_BY_NAME[levelFilter] ?? 0
      entries = entries.filter((e) => (e["level"] as number) >= minLevel)
    }

    if (search) {
      entries = entries.filter(
        (e) =>
          String(e["msg"] ?? "").toLowerCase().includes(search) ||
          String(e["name"] ?? "").toLowerCase().includes(search),
      )
    }

    const total = entries.length
    const page = entries.slice(offset, offset + limit)

    return ok(c, { entries: page, total })
  })
