.PHONY: spec-build api-generate generate mock lint lint-fix test test-e2e

spec-build:
	cd spec && npx tsp compile .

api-generate:
	cd frontend && npx orval

generate: spec-build api-generate

mock:
	npx @stoplight/prism-cli mock spec/tsp-output/@typespec/openapi3/openapi.yaml --port 4010

lint:
	npx eslint .

lint-fix:
	npx eslint . --fix

test:
	cd backend && npx vitest run
	cd frontend && npx vitest run

test-e2e:
	cd e2e && npx playwright test

dev-backend:
	cd backend && npx tsx watch src/index.ts

dev-frontend:
	cd frontend && npx vite dev
