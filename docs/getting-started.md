# Getting Started

## Prerequisites

- [pnpm](https://pnpm.io/) >= 10.5
- [Bun](https://bun.sh) >= 1.3

`pnpm` is the package manager for this monorepo. Bun is still used by `packages/api` as the runtime/build tool.

## Install

```bash
pnpm install
```

---

## Database Setup

All `db:*` commands must be run from `packages/api/` with the correct env vars set.

### Step 1 — Configure env

Copy the example env file:

```bash
cp packages/api/.env.example packages/api/.env
```

**SQLite** (default, zero config — recommended for local dev):
```env
DB_DRIVER=sqlite
DATABASE_URL=local.db
```

**PostgreSQL** (staging / production):
```env
DB_DRIVER=pg
DATABASE_URL=postgres://user:pass@localhost:5432/timeagent
```

### Step 2 — Init database

```bash
cd packages/api
pnpm run db:push   # creates tables from schema
pnpm run db:seed   # optional: insert sample data
```

---

## Workflow: Schema Changes

When you add or modify a table/column, choose one of two workflows:

### Dev — `db:push` (fast, no migration files)

Best for local iteration. Directly syncs your schema to the DB.

```bash
# 1. Edit the schema file
#    packages/api/src/db/schema/users.sqlite.ts  (or .pg.ts)

# 2. Push changes
cd packages/api
pnpm run db:push
```

> No migration history is recorded. Safe for local dev, **do not use on shared/production DB**.

---

### Production — `db:generate` + `db:migrate` (safe, auditable)

Generates a `.sql` migration file you can review before applying.

```bash
# 1. Edit the schema file

# 2. Generate migration file → saved to packages/api/drizzle/
cd packages/api
pnpm run db:generate

# 3. Review the generated SQL in packages/api/drizzle/*.sql

# 4. Apply to database
pnpm run db:migrate
```

Migration history is tracked in the `__drizzle_migrations` table — same concept as EF Core's `__EFMigrationsHistory`.

---

## Switching SQLite ↔ PostgreSQL

Both drivers share the same schema shape but use dialect-specific files:

| File | Used when |
|---|---|
| `src/db/schema/users.sqlite.ts` | `DB_DRIVER=sqlite` |
| `src/db/schema/users.pg.ts` | `DB_DRIVER=pg` |

To switch, update `.env` and re-run `db:push` (or `db:generate` + `db:migrate` for production).

---

## Seeding

```bash
cd packages/api
pnpm run db:seed
```

Inserts sample users. Safe to run multiple times — uses `onConflictDoNothing()`.

To customize seeds, edit `packages/api/src/db/seed.ts`.

---

## Drizzle Studio (DB GUI)

```bash
cd packages/api
pnpm run db:studio
# → https://local.drizzle.studio
```

---

## Run Dev Servers

Open two terminals:

```bash
# Terminal 1 — API (port 3000)
pnpm dev:api

# Terminal 2 — Web (port 5173)
pnpm dev:web
```

Web proxies `/api/*` → `http://localhost:3000`.

To run both from the repo root:

```bash
pnpm dev
```

---

## Build

From the repo root:

```bash
pnpm build
```

Or per package:

```bash
pnpm --filter @time/web build
pnpm --filter @time/api build
```

---

## API Endpoints

### Users CRUD

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/v1/users` | — |
| `GET` | `/api/v1/users/:id` | — |
| `POST` | `/api/v1/users` | `{ username, email, password, fullname }` |
| `PATCH` | `/api/v1/users/:id` | any field (partial) |
| `DELETE` | `/api/v1/users/:id` | — |

Password is hashed with `Bun.password.hash()` (bcrypt) and never returned in responses.

### Realtime

| Protocol | Path | Description |
|---|---|---|
| SSE | `GET /api/v1/sse` | Server-sent events, streams every 1.5s |
| WebSocket | `GET /api/v1/ws` | Bi-directional, broadcasts to all connected tabs |

---

## Project Structure

```
time-agent/
├── packages/
│   ├── shared/                   — types, zod schemas, utils, constants
│   ├── api/
│   │   ├── drizzle/              — generated migration files
│   │   ├── drizzle.config.ts     — drizzle-kit config (dialect switch)
│   │   └── src/
│   │       ├── db/
│   │       │   ├── schema/
│   │       │   │   ├── users.pg.ts      — PostgreSQL schema
│   │       │   │   ├── users.sqlite.ts  — SQLite schema
│   │       │   │   └── types.ts         — inferred TS types
│   │       │   ├── index.ts             — driver switch by env
│   │       │   └── seed.ts              — seed script
│   │       ├── routes/
│   │       │   ├── users.ts    — CRUD
│   │       │   ├── sse.ts      — Server-Sent Events
│   │       │   └── ws.ts       — WebSocket
│   │       └── index.ts        — Hono app entry
│   └── web/                    — Vite + React 19 + TanStack Router + shadcn/ui
├── docs/
└── tsconfig.base.json
```
