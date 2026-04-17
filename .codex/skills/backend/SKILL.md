---
name: backend
description: Use for backend work in this repository: Hono routes, validators, services, Drizzle schemas, shared API contracts, and CRUD feature structure. Apply when implementing or refactoring API endpoints, request validation, DB schema changes, or backend feature slices such as shared -> api flow.
---

# Backend

Use this skill for work under `packages/api` and the backend side of `packages/shared`.

## Stack

- Runtime: Bun
- HTTP: Hono
- Validation: Zod via `@hono/zod-validator`
- DB access: Drizzle
- Shared contracts: `@time/shared`

## Default Structure

For a CRUD-style resource, prefer:

```txt
packages/shared/src/
  schemas/
    <resource>.ts

packages/api/src/
  routes/
    <resource>/
      route.ts
      validator.ts
  services/
    <resource>-service.ts
  db/schema/
    <resource>.pg.ts
    <resource>.sqlite.ts
```

## Responsibilities

- `packages/shared/src/schemas/<resource>.ts`
  - Define request and response contracts with Zod
  - Infer exported types from schemas
- `packages/api/src/routes/<resource>/validator.ts`
  - Keep HTTP request validation only
  - Use `zValidator(...)` with schemas from `@time/shared`
- `packages/api/src/routes/<resource>/route.ts`
  - Keep routes thin
  - Read `c.req`
  - Call services
  - Return `ok(...)`
- `packages/api/src/services/<resource>-service.ts`
  - Put business logic here
  - Query Drizzle
  - Map DB rows to safe public objects
  - Do not depend on Hono context

## Rules

- Shared contracts are the source of truth for API/Web payload shape
- DB schema is a persistence model, not a public response model
- Never return internal fields such as `password`
- Schema validation does not replace business-rule validation
- Keep route files small; move logic into services before routes become dense
- If a feature already has its own folder, use short names like `route.ts` and `validator.ts`
- Cross-package imports should use package names such as `@time/shared`

## Current Reference

Use `users` as the current reference implementation:

- `packages/shared/src/schemas/user.ts`
- `packages/api/src/routes/users/route.ts`
- `packages/api/src/routes/users/validator.ts`
- `packages/api/src/services/user-service.ts`
