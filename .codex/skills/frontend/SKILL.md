---
name: frontend
description: Use for frontend work in this repository: React pages, TanStack Router routes, React Query hooks, shadcn/ui forms, and shared contract usage from @time/shared. Apply when implementing or refactoring UI features, CRUD pages, API hooks, or frontend feature structure such as shared -> web flow.
---

# Frontend

Use this skill for work under `packages/web` and the frontend side of `packages/shared`.

## Stack

- UI: React + Vite
- Routing: TanStack Router
- Data fetching: React Query
- Forms: React Hook Form + Zod resolver
- UI kit: shadcn/ui
- Shared contracts: `@time/shared`

## Default Structure

For a CRUD-style resource, prefer:

```txt
packages/web/src/
  hooks/
    use<Resource>.ts
  pages/
    <resource>/
      components/
        <resource>-form.tsx
      hooks/
        use-<resource>-table.ts
      schemas/
        <resource>-schema.ts
      <resource>-create-page.tsx
      <resource>-edit-page.tsx
```

## Responsibilities

- `hooks/use<Resource>.ts`
  - Own API calls and query invalidation
  - Import payload and response types from `@time/shared`
- `pages/<resource>/schemas/<resource>-schema.ts`
  - Re-export shared schemas when frontend and backend contracts match
  - Add frontend-only schemas only when UX rules need to diverge
- `pages/<resource>/components/<resource>-form.tsx`
  - Own form state and field rendering
  - Stay generic enough to support create/update when practical
- `pages/<resource>/hooks/*`
  - Hold feature-local view hooks that are specific to one page or table flow
  - Keep these hooks near the feature instead of promoting them to global hooks too early
- `pages/<resource>/*-page.tsx`
  - Compose hooks, form components, page layout, and navigation

## Rules

- Prefer shared contracts from `@time/shared` over redefining request or response types locally
- Keep API details in hooks, not in page components
- Keep page components focused on composition and flow
- Reuse form components when create and edit are close enough
- If frontend validation intentionally differs from backend validation, keep that difference explicit
- Internal package imports may use `@/` when the package config supports it

## Current Reference

Use `users` as the current reference implementation:

- `packages/web/src/hooks/useUsers.ts`
- `packages/web/src/pages/users/schemas/user-schema.ts`
- `packages/web/src/pages/users/components/user-form.tsx`
- `packages/web/src/pages/users/hooks/use-users-table.ts`
- `packages/web/src/pages/users/users-create-page.tsx`
- `packages/web/src/pages/users/users-edit-page.tsx`
