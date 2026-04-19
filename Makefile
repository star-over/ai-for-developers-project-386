.DEFAULT_GOAL := help

# --- Generation ---

generate: ## TypeSpec → OpenAPI → Orval hooks
	cd spec && npx tsp compile .
	cd frontend && npx orval

# --- Development ---

dev-frontend: ## Vite dev server (port 5173)
	cd frontend && npx vite dev

dev-backend: ## Fastify dev server (port 3000)
	cd backend && npx tsx watch src/index.ts

mock: ## Prism mock server (port 4010)
	npx @stoplight/prism-cli mock spec/tsp-output/@typespec/openapi3/openapi.yaml --port 4010 --dynamic

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

check: lint typecheck test ## Full quality gate (pre-commit)

# --- Help ---

help: ## Show available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

.PHONY: generate dev-frontend dev-backend mock lint lint-fix typecheck test test-e2e check help
