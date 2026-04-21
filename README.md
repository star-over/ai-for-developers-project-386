# Calendar — Запись на звонок

Упрощённый сервис бронирования времени по мотивам [Cal.com](https://cal.com). Владелец публикует доступные слоты, гость выбирает свободное время и записывается на звонок.

### Hexlet tests and linter status:
[![Actions Status](https://github.com/star-over/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/star-over/ai-for-developers-project-386/actions)

**Live:** https://ai-for-developers-project-386-g9qt.onrender.com

## Стек

- **Frontend:** Svelte 5, Vite, Tailwind 4, shadcn-svelte, TanStack Query
- **Backend:** Node.js, Fastify, Drizzle ORM, SQLite
- **API:** TypeSpec → OpenAPI 3.x → Orval
- **Тесты:** Vitest, Playwright
- **Деплой:** Docker

## Запуск

```bash
# Разработка
make dev-backend    # Fastify на :3000
make dev-frontend   # Vite на :5173
make mock           # Prism mock-сервер на :4010

# Генерация кода из API-контракта
make generate

# Тесты
make test           # Unit-тесты
make test-e2e       # E2E тесты

# Линтинг
make lint
make lint-fix

# Docker
docker build -t calendar .
docker run -p 3000:3000 -v ./data:/app/data calendar
```

## Документация

- [Спецификация](docs/spec.md) — роли, модели, бизнес-правила, API, страницы
- [Архитектура](docs/architecture.md) — стек, структура, pipeline, Docker
- [План реализации](docs/plan.md) — 22 задачи от контракта до деплоя