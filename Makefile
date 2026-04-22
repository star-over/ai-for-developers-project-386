.DEFAULT_GOAL := help

# --- Generation ---

generate: ## TypeSpec → OpenAPI → Orval hooks
	cd spec && npx tsp compile .
	cd frontend && npx orval

# --- Development ---

dev-frontend: kill-frontend ## Vite dev server (port 5173)
	cd frontend && npx vite dev

dev-backend: kill-backend ## Fastify dev server (port 3000)
	cd backend && npx tsx watch src/index.ts

mock: ## Prism mock server (port 4010)
	npx @stoplight/prism-cli mock spec/tsp-output/@typespec/openapi3/openapi.yaml --port 4010 --dynamic

# --- Process management ---

kill-frontend: ## Kill process on port 5173
	@lsof -ti :5173 | xargs kill -9 2>/dev/null || true

kill-backend: ## Kill process on port 3000
	@lsof -ti :3000 | xargs kill -9 2>/dev/null || true

kill-all: kill-frontend kill-backend ## Kill frontend + backend processes

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

lint: ## ESLint strict (errors + warnings block, for pre-commit)
	npx eslint . --max-warnings 0

lint-dev: ## ESLint dev (only errors block, warnings shown but pass)
	npx eslint .

lint-fix: ## ESLint autofix
	npx eslint . --fix

typecheck: ## TypeScript check (frontend + backend)
	cd frontend && npx svelte-check --tsconfig ./tsconfig.json
	cd backend && npx tsc --noEmit

test: ## Vitest (frontend + backend)
	cd backend && npx vitest run --reporter=dot
	cd frontend && npx vitest run --reporter=dot --passWithNoTests

test-e2e: ## Playwright e2e tests
	cd e2e && npx playwright test --reporter=dot

check: lint typecheck test build ## Full quality gate (pre-commit)

# --- Help ---

help: ## Show available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

.PHONY: generate dev-frontend dev-backend mock lint lint-dev lint-fix typecheck test test-e2e build-frontend build-backend build docker-build docker-run check help kill-frontend kill-backend kill-all
