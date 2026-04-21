# Docker & CI/CD Deploy Design

Дата: 2026-04-21  
Статус: **✅ Реализовано**  
Live: https://ai-for-developers-project-386-g9qt.onrender.com

## Цель

Упаковать frontend (Svelte 5 SPA) и backend (Fastify) в один Docker-образ. Деплой на Render.com (free tier). CI/CD: GitHub Actions проверяет качество → триггерит деплой на Render через Render REST API.

## CI/CD Pipeline

```
git push origin master
        │
        └──→ GitHub Actions (ci.yml)
              ├─ Job: check (все ветки)
              │   npm ci → make check (lint, typecheck, test, build)
              │
              └─ Job: deploy (только master, needs: check)
                  POST https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys
                        │
                        └──→ Render.com (Docker runtime)
                              1. git clone repo
                              2. docker build (4-stage multi-stage)
                              3. docker run (PORT от Render)
                              4. health check /api/health
                              5. переключение трафика
```

Ключевое решение: деплой происходит **только после успешного CI**. Auto-deploy на Render выключен.

### GitHub Secrets

| Secret | Значение |
|--------|---------|
| `RENDER_API_KEY` | Render API токен (из `~/.render/cli.yaml`) |
| `RENDER_SERVICE_ID` | ID сервиса на Render (`srv-d7jrb1hf9bms73b2bajg`) |

> Deploy Hook URL недоступен через Render API — используем прямой вызов REST API.

## Архитектура Docker-образа

Один процесс — Fastify обслуживает и API, и статику SPA.

```
Docker container (~200MB, node:22-alpine)
└── node dist/index.js (Fastify, PORT)
    ├── /api/*  → API handlers
    └── /*      → @fastify/static → index.html (SPA fallback)
```

## Dockerfile: Multi-Stage Build

4 стадии, базовый образ `node:22-alpine` (~130MB):

### Stage 1 — frontend-build
- `WORKDIR /app/frontend`
- `COPY frontend/package.json frontend/package-lock.json ./`
- `RUN npm ci`
- `COPY frontend/ ./`
- `RUN npm run build` → собирает SPA в `dist/`

> **Gotcha:** `frontend/package.json` не должен иметь `prebuild` скрипт с `eslint` — ESLint живёт в корневом `node_modules`, в Docker недоступен.

### Stage 2 — backend-deps
- `WORKDIR /app/backend`
- `COPY backend/package.json backend/package-lock.json ./`
- `RUN npm ci --omit=dev` → только production-зависимости (fastify, zod, @fastify/static)

### Stage 3 — backend-build
- `WORKDIR /app/backend`
- `COPY backend/package.json backend/package-lock.json ./`
- `RUN npm ci` (с devDependencies для tsc)
- `COPY backend/ ./`
- `RUN npm run build` → компилирует TS в `dist/` (через скрипт `"build": "tsc"`)

> **Важно:** использовать `npm run build`, а не `npx tsc` — надёжнее в Alpine окружении.

### Stage 4 — production
- `WORKDIR /app`
- Создать non-root user `nodejs` (uid 1001)
- `COPY --from=backend-deps /app/backend/node_modules ./node_modules`
- `COPY --from=backend-build /app/backend/dist ./dist`
- `COPY --from=backend-build /app/backend/data ./data`
- `COPY --from=backend-build /app/backend/package.json ./`
- `COPY --from=frontend-build /app/frontend/dist ./public`
- `USER nodejs`
- `ENV NODE_ENV=production`
- `CMD ["node", "dist/index.js"]`

Финальный образ ~200MB (Alpine + Node.js runtime + production node_modules).

## Изменения в Backend

### Новая зависимость
- `@fastify/static` — production dependency для раздачи статики

### app.ts — раздача SPA
- Регистрация `@fastify/static` с `root: resolve(__dirname, '..', 'public')`, `wildcard: false`
- Условная регистрация: только если папка `public/` существует (в dev её нет)
- `setNotFoundHandler`: если URL не `/api/*` → отдать `index.html`; если `/api/*` → вернуть 404 JSON

### package.json — новые скрипты
```json
"build": "tsc",
"start": "node dist/index.js"
```

## Новые файлы

| Файл | Назначение |
|------|-----------|
| `Dockerfile` | Multi-stage build (4 стадии) |
| `.dockerignore` | Исключение node_modules, .git, docs, e2e и т.д. |
| `render.yaml` | Blueprint для создания Docker Web Service на Render |

## render.yaml (Blueprint)

```yaml
services:
  - type: web
    name: ai-for-developers-project-386
    runtime: docker
    dockerfilePath: ./Dockerfile
    branch: master
    region: frankfurt
    plan: free
    healthCheckPath: /api/health
    autoDeploy: false
```

> **Фактически:** сервис создан в регионе Virginia (Render не позволил изменить через API после создания). Auto-deploy выключен через Render REST API.

## CI/CD: GitHub Actions (`ci.yml`)

```yaml
deploy:
  needs: check
  if: github.ref == 'refs/heads/master'
  runs-on: ubuntu-latest
  steps:
    - name: Trigger Render deploy
      run: |
        curl -s -X POST \
          "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys" \
          -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
          -H "Content-Type: application/json" \
          -d '{"clearCache": "do_not_clear"}'
```

## Makefile — новые команды

```makefile
build-frontend:    ## Build frontend (Vite → dist)
build-backend:     ## Build backend (tsc → dist)
build:             ## Build frontend + backend
docker-build:      ## Build Docker image
docker-run:        ## Run Docker container (PORT=10000)
```

## Render: настройки сервиса

| Параметр | Значение |
|----------|---------|
| Service ID | `srv-d7jrb1hf9bms73b2bajg` |
| Name | `ai-for-developers-project-386` |
| URL | https://ai-for-developers-project-386-g9qt.onrender.com |
| Runtime | Docker |
| Region | Virginia (us-east) |
| Plan | Free |
| Health Check | `/api/health` |
| Auto-deploy | Off |

## Ограничения Free Tier
- Контейнер засыпает через 15 минут неактивности (cold start ~30–60 сек)
- In-memory данные теряются при рестарте → seed из JSONL при каждом старте
- RAM: 512 MB, CPU: 0.1
