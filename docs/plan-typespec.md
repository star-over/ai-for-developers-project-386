# Подплан: TypeSpec API-контракт (Task 1 + Task 2)

> Результат: Makefile + TypeSpec спецификация + сгенерированный OpenAPI + работающий Prism mock-сервер.

**Зависимости:** нет (первый шаг проекта)
**Блокирует:** Task 3 (backend), Task 9 (frontend), Task 10 (Orval)

---

## Step 1: Создать Makefile

- [ ] Создать `Makefile` в корне проекта

```makefile
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
```

- [ ] Commit: `chore: add root Makefile`

---

## Step 2: Инициализировать spec пакет

- [ ] `mkdir -p spec && cd spec && npm init -y`
- [ ] `npm install @typespec/compiler @typespec/http @typespec/rest @typespec/openapi3`

---

## Step 3: Создать tspconfig.yaml

- [ ] Создать `spec/tspconfig.yaml`

```yaml
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    output-file: openapi.yaml
```

---

## Step 4: Написать API-контракт spec/main.tsp

Один файл, все модели и роуты. Каждая модель, поле и операция — с `@doc`.

### Модели

| Модель | Поля | Примечание |
|--------|------|------------|
| Duration | union 10\|15\|20\|30 | Числа в JSON |
| EventType | id, name (minLength 1), duration, createdAt | — |
| Booking | id, eventTypeId, eventTypeName, duration, guestName, guestEmail, startTime, endTime, createdAt | Денормализован |
| Slot | startTime, endTime, available | Глобальная доступность |
| CreateEventTypeRequest | name (minLength 1), duration | — |
| UpdateEventTypeRequest | name?, duration? | Partial |
| CreateBookingRequest | eventTypeId, guestName (minLength 1), guestEmail, startTime | Backend заполняет eventTypeName, duration, endTime |
| ErrorResponse | message | Для 400, 404, 409 |

### Endpoints

| # | Метод | Путь | Success | Errors |
|---|-------|------|---------|--------|
| 1 | GET | /api/event-types | 200 EventType[] | — |
| 2 | POST | /api/event-types | 201 EventType | 400 |
| 3 | PATCH | /api/event-types/:id | 200 EventType | 400, 404 |
| 4 | DELETE | /api/event-types/:id | 204 | 404 |
| 5 | GET | /api/slots?date=&eventTypeId= | 200 Slot[] | 400 |
| 6 | POST | /api/bookings | 201 Booking | 400, 404, 409 |
| 7 | GET | /api/bookings/:id | 200 Booking | 404 |
| 8 | DELETE | /api/bookings/:id | 204 | 404 |
| 9 | GET | /api/admin/bookings | 200 Booking[] | — |

### Ключевые решения

- `@doc` на каждом поле, модели и операции — AI-agent context
- Duration как union (числа), не enum (строки)
- Booking денормализован: eventTypeName + duration — копии, не FK
- Email валидация — на Zod, не TypeSpec
- Без пагинации
- `openapi.yaml` коммитится в git

Полный код `main.tsp` — см. `docs/plan.md`, Task 2, Step 4.

---

## Step 5: Скомпилировать и проверить

- [ ] `cd spec && npx tsp compile .`
- [ ] Проверить что `spec/tsp-output/@typespec/openapi3/openapi.yaml` создан без ошибок
- [ ] Проверить в openapi.yaml:
  - 9 endpoints с правильными методами и путями
  - Все модели с descriptions
  - HTTP-коды: 201 для POST, 204 для DELETE, 400/404/409 ошибки

---

## Step 6: Проверить Prism mock-сервер

- [ ] `make mock` (или `npx @stoplight/prism-cli mock spec/tsp-output/@typespec/openapi3/openapi.yaml --port 4010`)
- [ ] Mock-сервер стартует без ошибок
- [ ] Тестовые запросы отвечают корректно:
  - `GET http://localhost:4010/api/event-types` → 200
  - `POST http://localhost:4010/api/event-types` → 201

---

## Step 7: Commit spec

- [ ] `git add spec/`
- [ ] Commit: `feat: add TypeSpec API contract with OpenAPI generation`

---

## Критерии завершения

- [ ] `make spec-build` выполняется без ошибок
- [ ] `openapi.yaml` содержит 9 endpoints с правильными кодами
- [ ] `make mock` стартует Prism без ошибок
- [ ] Два коммита: Makefile + spec/
