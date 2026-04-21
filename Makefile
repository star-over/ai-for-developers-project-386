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

build: ## Build frontend
	cd frontend && npm run build

check: lint typecheck test build ## Full quality gate (pre-commit)

# --- Help ---

help: ## Show available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

.PHONY: generate dev-frontend dev-backend mock lint lint-fix typecheck test test-e2e build check help kill-frontend kill-backend kill-all
