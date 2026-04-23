# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

«Запись на звонок» — упрощённый сервис бронирования времени по мотивам Cal.com.
Hexlet educational project "AI for Developers" (project-386). Repository: `star-over/ai-for-developers-project-386`.

## Approach

- **Design First:** TypeSpec → OpenAPI → раздельная реализация фронтенда и бэкенда
- API-контракт (`spec/main.tsp` → `openapi.yaml`) — единый источник правды
- Вся разработка ведётся через AI-агентов, ручной код не пишется

## Tech Stack

### Frontend
- Svelte 5 (runes), Vite, Tailwind 4, shadcn-svelte
- @tanstack/svelte-query, @mateothegreat/svelte5-router
- Orval (генерация TanStack Query хуков из OpenAPI)
- SPA, без SSR/SvelteKit

### Backend
- Node.js + Fastify, Zod validation, in-memory store (Map + JSONL seed)
- Drizzle ORM + SQLite — будущий этап

### Validation
- Zod (frontend + backend, shared validation schemas)
- Zod schemas: `.describe()` on every field + custom error messages for AI-agent context
- Shared constants (`shared/constants.js`): `VALID_DURATIONS`, `SLOT_DURATION`, `WORK_START_HOUR`, `WORK_END_HOUR`
- Backend `validation.ts`: atomic schemas (`UuidSchema`, `DurationSchema`, `IsoDatetimeSchema`) + API schemas + record schemas
- Frontend `schemas.ts`: form validation with Russian messages, imports `VALID_DURATIONS` from shared
- Never duplicate Zod schemas or constants — single source of truth through `shared/` and `validation.ts`

### Testing
- Vitest (unit), Playwright (e2e)
- Backend tests organized by business domains, not API resources:
  - `tests/helpers.ts` — shared factories (`createTestApp`, `createEventType`, `createBooking`)
  - `tests/scheduling.test.ts` — bookings + slots + availability (unified scheduling domain)
  - `tests/event-types.test.ts` — CRUD + validation for event types, health endpoint
  - `tests/admin.test.ts` — admin bookings list
  - `tests/data-integrity.test.ts` — store + seed data validation
- Frontend tests split by concern:
  - `__tests__/utils.test.ts` — getDurationColors, formatDate, formatTime
  - `__tests__/validation.test.ts` — bookingSchema, eventTypeSchema edge cases
- Frontend vitest uses `TZ=UTC` (set in `vite.config.ts` `test.env`) for deterministic date/time assertions
- All backend test files use `afterEach` with `app.close()` for cleanup
- When adding new backend tests, use factories from `helpers.ts` — never inline `buildApp()` + `app.ready()` + `app.inject(POST /api/event-types)`

### Tooling
- TypeSpec → OpenAPI 3.x
- Prism (mock-сервер для разработки фронта без бэкенда)
- ESLint 10 (flat config), Airbnb style
- Docker (multi-stage build)

## Project Structure

```
shared/         # Общие константы (JS + .d.ts) для frontend и backend
spec/           # TypeSpec → OpenAPI
frontend/       # Svelte 5 SPA
backend/        # Fastify API + SQLite
e2e/            # Playwright e2e тесты
docs/           # spec.md, architecture.md, plan.md
Makefile        # Команды сборки, генерации, тестов
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

- **errors** — только то, что ломает билд или вызывает баги (`eqeqeq`, `no-var`, `import-x/no-cycle`, etc.)
- **warnings** — стиль и качество кода (`no-explicit-any`, `no-unused-vars`, `no-non-null-assertion`, `ban-ts-comment`, etc.)
- `make lint` (pre-commit) — `--max-warnings 0`, любой warning = fail
- `make lint-dev` (разработка) — warnings показываются, но не блокируют
- При имплементации фокус на errors, warnings устраняются отдельным этапом

## Code Style

- New functions: `const fx = (props) => {}` with call `fx({ var1, var2 })` — named params via object for AI-agent readability
- ESLint: warn level, not blocking. Apply after working code is ready

## Git Workflow

- Work directly on `master` — no feature branches
- Restart dev-server after any git operations that change files
- Always use `/caveman-commit` for commit messages
- Pre-commit hook runs `make check` (lint + typecheck + test) automatically

## CI

- GitHub Actions workflow `.github/workflows/hexlet-check.yml` runs Hexlet's automated checks on every push. **Do not edit or delete this file.**

## Docs

- `docs/spec.md` — спецификация продукта (роли, модели, бизнес-правила, API, страницы)
- `docs/architecture.md` — архитектура и стек
- `docs/plan.md` — план реализации (22 задачи)
- **DO NOT** create `docs/superpowers/`, `docs/designs/`, or any extra subdirectories in `docs/`. All documentation lives flat in `docs/`.
- **Prefer updating existing files.** If new knowledge fits into an existing doc — add it there organically, don't create a separate file.
- **New files are OK** when a genuinely new entity or concept emerges (e.g., UI design conventions, deployment guide) that doesn't belong in existing docs. Create it flat in `docs/`, not in subdirectories.
