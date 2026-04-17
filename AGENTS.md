# Time Agent

Time Agent is built with Bun, Hono, Drizzle, React, Vite, TanStack Router, React Query, and shadcn/ui.

This monorepo has 3 main packages:

- `packages/shared`: shared contracts used by both API and Web
- `packages/api`: Hono + Drizzle + Bun backend
- `packages/web`: React + TanStack Router + React Query frontend

## Core Rules

- Shared contracts are the source of truth for API/Web contracts
- DB schema is not the same thing as the public response model
- Map public-safe models before returning responses
- Keep backend and frontend details in skills instead of expanding this file

## Working Style

- Think before coding: state assumptions, surface ambiguities, and prefer the simplest solution that fits the request
- Make surgical changes only: touch the minimum necessary code and avoid unrelated cleanup or refactors
- Do not scan the whole project by default: start from the user-provided context and the most relevant files only
- Use the `users` flow below as the default end-to-end reference before searching wider
- If context is still insufficient, then read source or search for nearby files deliberately instead of exploring broadly
- When requirements are unclear or multiple interpretations are plausible, stop and ask rather than guessing silently

## Skills

- Backend details: [backend skill](/Users/time/time-agent/.codex/skills/backend/SKILL.md)
- Frontend details: [frontend skill](/Users/time/time-agent/.codex/skills/frontend/SKILL.md)

## Reference

Use `users` as the current end-to-end reference:

- Shared contract: `packages/shared/src/schemas/user.ts`
- API route: `packages/api/src/routes/users/route.ts`
- API validator: `packages/api/src/routes/users/validator.ts`
- API service: `packages/api/src/services/user-service.ts`
- Web hook: `packages/web/src/hooks/useUsers.ts`
- Web feature schema bridge: `packages/web/src/pages/users/schemas/user-schema.ts`
- Web feature form component: `packages/web/src/pages/users/components/user-form.tsx`
