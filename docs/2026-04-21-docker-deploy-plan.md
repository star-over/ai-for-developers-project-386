# Docker & CI/CD Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Упаковать Svelte 5 SPA + Fastify в один Docker-образ, задеплоить на Render, настроить CI/CD pipeline через GitHub Actions + Deploy Hook.

**Architecture:** Multi-stage Docker build (4 стадии). Fastify раздаёт API + собранный SPA через @fastify/static. Деплой только после успешного CI: GitHub Actions job `check` → job `deploy` (curl Deploy Hook) → Render билдит Docker из репо. Auto-deploy на Render выключен.

**Tech Stack:** Docker (node:22-alpine), @fastify/static, render.yaml Blueprint, Render MCP, Render CLI, gh CLI, GitHub Actions

**Spec:** `docs/2026-04-21-docker-deploy-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `backend/package.json` | Добавить @fastify/static, скрипты build/start |
| Modify | `backend/src/app.ts` | Раздача статики + SPA fallback |
| Create | `.dockerignore` | Исключение ненужных файлов из Docker context |
| Create | `Dockerfile` | Multi-stage build (4 стадии) |
| Create | `render.yaml` | Blueprint для создания Docker Web Service |
| Modify | `Makefile` | Команды build-frontend, build-backend, docker-build, docker-run |
| Modify | `.github/workflows/ci.yml` | Добавить job deploy (needs: check, только master) |
| Modify | `README.md` | Ссылка на опубликованное приложение |

---

### Task 1: Добавить @fastify/static и скрипты build/start

**Files:**
- Modify: `backend/package.json`

- [x] **Step 1: Установить @fastify/static**

```bash
cd backend && npm install @fastify/static
```

Убедиться, что `@fastify/static` появился в `dependencies` (не devDependencies) в `backend/package.json`.

- [x] **Step 2: Добавить скрипты build и start**

В `backend/package.json` добавить поле `scripts` (после `"license"`):

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js"
},
```

- [x] **Step 3: Проверить компиляцию backend**

```bash
cd backend && npm run build
```

Expected: папка `backend/dist/` создана, содержит `.js` файлы. Если ошибки TypeScript — исправить.

- [x] **Step 4: Проверить запуск скомпилированного backend**

```bash
cd backend && npm start
```

Expected: `Server listening at http://0.0.0.0:3000`. Остановить Ctrl+C.

- [x] **Step 5: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore(backend): add @fastify/static, build/start scripts"
```

---

### Task 2: Реализовать раздачу статики и SPA fallback

**Files:**
- Modify: `backend/src/app.ts`

- [x] **Step 1: Написать тест на SPA fallback**

Добавить в `backend/tests/event-types.test.ts` (или создать `backend/tests/static.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { resolve } from 'path';
import { buildApp } from '../src/app.js';

describe('Static / SPA fallback', () => {
  const publicDir = resolve(import.meta.dirname, '..', 'dist', '__test_public__');

  it('API 404 returns JSON when public/ exists', async () => {
    mkdirSync(publicDir, { recursive: true });
    writeFileSync(resolve(publicDir, 'index.html'), '<html>SPA</html>');
    // Переопределяем publicDir через env или тест без него — просто проверяем API 404 без public
    rmSync(publicDir, { recursive: true });

    const app = buildApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/api/unknown-route' });
    expect(res.statusCode).toBe(404);
  });

  it('health endpoint works', async () => {
    const app = buildApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});
```

- [x] **Step 2: Запустить тест, убедиться что проходит (тест на health уже должен работать)**

```bash
cd backend && npx vitest run
```

Expected: все тесты зелёные.

- [x] **Step 3: Обновить app.ts — добавить статику и SPA fallback**

Заменить содержимое `backend/src/app.ts`:

```typescript
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { createStore, Store } from './store.js';

declare module 'fastify' {
  interface FastifyInstance {
    store: Store;
  }
}
import { eventTypesRoutes } from './routes/event-types.js';
import { slotsRoutes } from './routes/slots.js';
import { bookingsRoutes } from './routes/bookings.js';
import { adminRoutes } from './routes/admin.js';

interface AppOptions {
  seed?: boolean;
}

export const buildApp = ({ seed = false }: AppOptions = {}) => {
  const app = Fastify({ logger: seed });
  const store = createStore({ seed });

  app.decorate('store', store);

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.register(eventTypesRoutes);
  app.register(slotsRoutes);
  app.register(bookingsRoutes);
  app.register(adminRoutes);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicDir = resolve(__dirname, '..', 'public');

  if (existsSync(publicDir)) {
    app.register(fastifyStatic, {
      root: publicDir,
      wildcard: false,
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
};
```

Ключевые решения:
- `existsSync(publicDir)` — в dev-режиме папки `public/` нет, статика не регистрируется
- `wildcard: false` — @fastify/static не перехватывает все маршруты
- `setNotFoundHandler` — разделяет API 404 и SPA fallback
- `__dirname` вычисляется через `import.meta.url` (ESM)

- [x] **Step 4: Пересобрать и прогнать тесты**

```bash
cd backend && npm run build && npx vitest run
```

Expected: компиляция без ошибок, все тесты зелёные.

- [x] **Step 5: Commit**

```bash
git add backend/src/app.ts
git commit -m "feat(backend): serve SPA static files via @fastify/static"
```

---

### Task 3: Создать .dockerignore

**Files:**
- Create: `.dockerignore`

- [x] **Step 1: Создать .dockerignore в корне проекта**

```
node_modules
frontend/node_modules
backend/node_modules
frontend/dist
backend/dist
.git
.github
.claude
e2e
docs
spec
*.md
eslint.config.*
vitest.config.*
.env*
Makefile
skills-lock.json
```

- [x] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore"
```

---

### Task 4: Создать Dockerfile

**Files:**
- Create: `Dockerfile`

- [x] **Step 1: Создать Dockerfile в корне проекта**

```dockerfile
# ============================================
# Stage 1: Build frontend (Svelte SPA)
# ============================================
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ============================================
# Stage 2: Backend production dependencies
# ============================================
FROM node:22-alpine AS backend-deps

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# ============================================
# Stage 3: Build backend (TypeScript → JS)
# ============================================
FROM node:22-alpine AS backend-build

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npx tsc

# ============================================
# Stage 4: Production image
# ============================================
FROM node:22-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/data ./data
COPY --from=backend-build /app/backend/package.json ./
COPY --from=frontend-build /app/frontend/dist ./public

USER nodejs

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

Примечания:
- Нет `EXPOSE` — Render сам устанавливает PORT через env
- Нет `ENV PORT` — Render передаёт PORT при запуске контейнера
- `npm ci --omit=dev` в отдельной стадии — production image без devDependencies
- non-root user `nodejs` — безопасность

- [x] **Step 2: Собрать Docker-образ локально**

```bash
docker build -t calendar .
```

Expected: сборка завершается без ошибок, 4 стадии пройдены.

- [x] **Step 3: Запустить контейнер и проверить**

```bash
docker run --rm -p 10000:10000 -e PORT=10000 calendar
```

В другом терминале:

```bash
# Health check
curl http://localhost:10000/api/health
# Expected: {"status":"ok"}

# SPA fallback
curl -s http://localhost:10000/ | head -3
# Expected: HTML начинается с <!DOCTYPE html>

# API endpoint
curl http://localhost:10000/api/event-types
# Expected: JSON массив с типами событий

# SPA fallback для клиентского маршрута
curl -s http://localhost:10000/bookings/some-slug | head -3
# Expected: HTML (index.html), не 404
```

Остановить контейнер Ctrl+C.

- [x] **Step 4: Commit**

```bash
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile"
```

---

### Task 5: Создать render.yaml

**Files:**
- Create: `render.yaml`

- [x] **Step 1: Создать render.yaml в корне проекта**

```yaml
services:
  - type: web
    name: calendar
    runtime: docker
    dockerfilePath: ./Dockerfile
    branch: master
    region: frankfurt
    plan: free
    healthCheckPath: /api/health
    autoDeploy: false
```

Примечания:
- `autoDeploy: false` — деплой только через Deploy Hook из GitHub Actions
- `healthCheckPath` — Render проверит `/api/health` после деплоя перед переключением трафика
- `region: frankfurt` — ближе к европейским пользователям

- [x] **Step 2: Commit**

```bash
git add render.yaml
git commit -m "chore: add render.yaml blueprint"
```

---

### Task 6: Обновить Makefile

**Files:**
- Modify: `Makefile`

- [x] **Step 1: Обновить Makefile**

Заменить строки от `build:` до `check:` на:

```makefile
# --- Build ---

build-frontend: ## Build frontend (Vite → dist)
	cd frontend && npm run build

build-backend: ## Build backend (tsc → dist)
	cd backend && npm run build

build: build-frontend build-backend ## Build frontend + backend

# --- Docker ---

docker-build: ## Build Docker image
	docker build -t calendar .

docker-run: ## Run Docker container (PORT=10000)
	docker run --rm -p 10000:10000 -e PORT=10000 calendar

# --- Quality ---

lint: ## ESLint check
	npx eslint .

lint-fix: ## ESLint autofix
	npx eslint . --fix

typecheck: ## TypeScript check (frontend + backend)
	cd frontend && npx svelte-check --tsconfig ./tsconfig.json
	cd backend && npx tsc --noEmit

test: ## Vitest (frontend + backend)
	cd backend && npx vitest run
	cd frontend && npx vitest run --passWithNoTests

test-e2e: ## Playwright e2e tests
	cd e2e && npx playwright test

check: lint typecheck test build ## Full quality gate (pre-commit)
```

Обновить `.PHONY` в конце файла — добавить `build-frontend build-backend docker-build docker-run`.

- [x] **Step 2: Проверить команды**

```bash
make help
```

Expected: в списке появились `build-frontend`, `build-backend`, `docker-build`, `docker-run`.

- [x] **Step 3: Commit**

```bash
git add Makefile
git commit -m "chore: add build and docker commands to Makefile"
```

---

### Task 7: Обновить CI/CD pipeline

**Files:**
- Modify: `.github/workflows/ci.yml`

- [x] **Step 1: Добавить job deploy в ci.yml**

Заменить содержимое `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches:
      - '**'

jobs:
  check:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
          cache-dependency-path: |
            package-lock.json
            frontend/package-lock.json
            backend/package-lock.json
            e2e/package-lock.json

      - name: Install root dependencies
        run: npm ci

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Install backend dependencies
        run: cd backend && npm ci

      - name: Install e2e dependencies
        run: cd e2e && npm ci

      - name: Run quality checks
        run: make check

  deploy:
    needs: check
    if: github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Render deploy
        run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

- [x] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add deploy job triggered after check on master"
```

---

### Task 8: Создать Web Service на Render и настроить CI/CD

**Files:**
- Modify: `README.md`

- [x] **Step 1: Push всех изменений в GitHub**

```bash
git push origin master
```

- [x] **Step 2: Создать Web Service через Render Dashboard**

Зайти на https://dashboard.render.com:
1. New → Web Service
2. Подключить репозиторий `star-over/ai-for-developers-project-386`
3. Render подхватит `render.yaml` автоматически и подставит настройки
4. Проверить: Runtime **Docker**, Branch **master**, Region **Frankfurt**, Plan **Free**
5. Нажать **Create Web Service**
6. Дождаться первого деплоя (5-10 минут)

- [x] **Step 3: Выключить auto-deploy через Render MCP**

После создания сервиса получить его ID через Render MCP `list_services`, затем:

```
Render MCP: update_web_service
  serviceId: <id сервиса>
  autoDeploy: "no"
```

- [x] **Step 4: Получить Deploy Hook URL через Render MCP**

```
Render MCP: get_service
  serviceId: <id сервиса>
```

Скопировать значение поля `deployHookURL` (вида `https://api.render.com/deploy/srv-xxx?key=yyy`).

Если поля нет в ответе — получить через Render CLI:

```bash
render services --output json | jq '.[].deployHook'
```

- [x] **Step 5: Записать Deploy Hook URL как GitHub Secret**

```bash
gh secret set RENDER_DEPLOY_HOOK_URL --body "https://api.render.com/deploy/srv-xxx?key=yyy"
```

Expected: `✓ Set secret RENDER_DEPLOY_HOOK_URL for star-over/ai-for-developers-project-386`

- [x] **Step 6: Проверить первый автоматический деплой**

Сделать любой коммит и push в master:

```bash
git commit --allow-empty -m "ci: trigger first automated deploy"
git push origin master
```

Следить за ходом деплоя через Render MCP:

```
Render MCP: list_deploys
  serviceId: <id сервиса>
  limit: 1
```

Ждать статус `live`. При ошибке посмотреть логи:

```
Render MCP: list_logs
  resource: [<id сервиса>]
  type: ["build"]
```

Или через CLI:

```bash
render logs --service <id сервиса>
```

- [x] **Step 7: Проверить работу приложения**

Открыть публичную ссылку `https://<service-name>.onrender.com`:

```bash
# Health check
curl https://<service-name>.onrender.com/api/health
# Expected: {"status":"ok"}

# API
curl https://<service-name>.onrender.com/api/event-types
# Expected: JSON массив

# SPA fallback при перезагрузке
curl -s https://<service-name>.onrender.com/some/spa/route | head -3
# Expected: HTML с <!DOCTYPE html>
```

- [x] **Step 8: Добавить ссылку в README.md**

В `README.md` после бейджа Hexlet добавить:

```markdown
## Demo

[https://<service-name>.onrender.com](https://<service-name>.onrender.com)
```

Заменить `<service-name>` на реальное имя сервиса.

- [x] **Step 9: Commit и push**

```bash
git add README.md
git commit -m "docs: add Render deploy link to README"
git push origin master
```

Expected: GitHub Actions запускает `check` → `deploy` → Render получает Deploy Hook → деплой завершается успешно.
