# API Schema Conventions

## Shared vs DB Model

- `packages/shared` is the source of truth for public request/response contracts
- Drizzle DB schema is a persistence model, not a public response model
- Never return internal-only fields directly from DB rows
- Map DB rows to public-safe models in services before returning responses

## Base Entity Rules

Every tenant-owned entity should include these base fields:

- `tenantId`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`

Current reference implementation:

- Shared base schema: `packages/shared/src/schemas/base.ts`
- Shared field lengths: `packages/shared/src/constants/field-lengths.ts`
- Postgres base columns: `packages/api/src/db/schema/base.pg.ts`
- SQLite base columns: `packages/api/src/db/schema/base.sqlite.ts`

## String Constraints

- Every string field must define an explicit max length
- Apply max length in both shared Zod schemas and Drizzle schema definitions
- Reuse shared constants from `packages/shared/src/constants/field-lengths.ts` instead of scattering literals

Examples:

- IDs: `ID_MAX_LENGTH`
- Tenant IDs: `TENANT_ID_MAX_LENGTH`
- Actor IDs: `ACTOR_ID_MAX_LENGTH`
- Usernames: `USERNAME_MAX_LENGTH`
- Emails: `EMAIL_MAX_LENGTH`
- Password hashes or stored passwords: `PASSWORD_MAX_LENGTH`
- Human-readable names: `FULLNAME_MAX_LENGTH`

## Multi-Tenant Direction

- Prefer tenant scoping by default for queries on tenant-owned entities
- Do not accept audit fields directly from client input schemas
- `createdBy` and `updatedBy` should be actor/user IDs, not display names
- Temporary fallback values like `"system"` are acceptable only until auth context is wired through middleware

## Migration Flow

- `make infra` currently runs `pnpm db:ensure` and `pnpm db:push`
- This applies schema changes directly with `drizzle-kit push`
- This is acceptable for local development, but versioned migrations should be preferred for stricter environments
