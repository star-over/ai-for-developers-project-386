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
- Node.js + Fastify, Drizzle ORM, SQLite

### Tooling
- TypeSpec → OpenAPI 3.x
- Prism (mock-сервер для разработки фронта без бэкенда)
- ESLint 9 (flat config), Airbnb style
- Vitest (unit), @testing-library/svelte, Playwright (e2e)
- Docker (multi-stage build)

## Project Structure

```
spec/           # TypeSpec → OpenAPI
frontend/       # Svelte 5 SPA
backend/        # Fastify API + SQLite
e2e/            # Playwright e2e тесты
docs/           # spec.md, architecture.md, plan.md
Makefile        # Команды сборки, генерации, тестов
```

## Key Commands

```bash
make generate      # TypeSpec → OpenAPI → Orval хуки
make mock          # Prism mock-сервер
make dev-backend   # Fastify dev server
make dev-frontend  # Vite dev server
make lint          # ESLint check
make lint-fix      # ESLint autofix
make test          # Vitest (frontend + backend)
make test-e2e      # Playwright e2e
```

## Linting Policy

- **errors** — только то, что ломает билд
- **warnings** — форматирование и стиль (Airbnb)
- При имплементации фокус на errors, warnings устраняются отдельным этапом

## CI

- GitHub Actions workflow `.github/workflows/hexlet-check.yml` runs Hexlet's automated checks on every push. **Do not edit or delete this file.**

## Docs

- `docs/spec.md` — спецификация продукта (роли, модели, бизнес-правила, API, страницы)
- `docs/architecture.md` — архитектура и стек
- `docs/plan.md` — план реализации (22 задачи)
