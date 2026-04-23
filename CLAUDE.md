# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Call Booking" — a simplified time-booking service inspired by Cal.com.
Hexlet educational project "AI for Developers" (project-386). Repository: `star-over/ai-for-developers-project-386`.

## Approach

- **Design First:** TypeSpec → OpenAPI → separate frontend and backend implementation
- API contract (`spec/main.tsp` → `openapi.yaml`) is the single source of truth
- All development is done via AI agents — no manual code

## Tech Stack

### Frontend
- Svelte 5 (runes), Vite, Tailwind 4, shadcn-svelte
- @tanstack/svelte-query, @mateothegreat/svelte5-router
- Orval (generates TanStack Query hooks from OpenAPI)
- SPA, no SSR/SvelteKit

### Backend
- Node.js + Fastify, Zod validation, in-memory store (Map + JSONL seed)
- Drizzle ORM + SQLite — future phase

### Validation
- Zod (frontend + backend), shared constants in `shared/constants.js`
- Never duplicate schemas or constants — single source of truth through `shared/` and `validation.ts`

### Testing
- Vitest (unit), Playwright (e2e)
- Backend: tests organized by business domains, factories in `tests/helpers.ts` — always use them for new tests
- Frontend: `TZ=UTC` set in `vite.config.ts` for deterministic date assertions

## Project Structure

```
shared/         # Shared constants (JS + .d.ts) for frontend and backend
spec/           # TypeSpec → OpenAPI
frontend/       # Svelte 5 SPA
backend/        # Fastify API + in-memory store
e2e/            # Playwright e2e tests
docs/           # spec.md, architecture.md, plan.md
Makefile        # Build, generate, test commands
```

## Key Commands

**Always use `make` — never `npm run` directly.**
Exception: `scripts.build` in package.json is kept for Dockerfile (`npm run build` in Docker stages).

```bash
make generate       # TypeSpec → OpenAPI → Orval hooks
make dev-frontend   # Vite dev server (port 5173)
make dev-backend    # Fastify dev server (port 3000)
make mock           # Prism mock server (port 4010)
make lint           # ESLint strict (errors + warnings block, for pre-commit)
make lint-dev       # ESLint dev (only errors block, warnings pass)
make lint-fix       # ESLint autofix
make typecheck      # TypeScript check (frontend + backend)
make test-backend   # Vitest backend
make test-frontend  # Vitest frontend
make test-e2e       # Playwright e2e
make test           # All tests (backend + frontend + e2e)
make check          # Full quality gate (pre-commit hook)
make help           # Show available commands
```

## Linting Policy

- `make lint` (pre-commit) — strict, any warning = fail
- `make lint-dev` (development) — warnings pass, only errors block

## Code Style

- New functions: `const fx = (props) => {}` with call `fx({ var1, var2 })` — named params via object for AI-agent readability

## Git Workflow

- Work directly on `master` — no feature branches
- Restart dev-server after any git operations that change files
- Always use `/caveman-commit` for commit messages
- Pre-commit hook runs `make check` (lint + typecheck + test) automatically

## CI

- GitHub Actions workflow `.github/workflows/hexlet-check.yml` runs Hexlet's automated checks on every push. **Do not edit or delete this file.**

## Docs

- `docs/spec.md` — product spec (roles, models, business rules, API, pages)
- `docs/architecture.md` — architecture and tech stack
- `docs/plan.md` — implementation plan (22 tasks)
- Docs live flat in `docs/` — no subdirectories. Prefer updating existing files over creating new ones.
