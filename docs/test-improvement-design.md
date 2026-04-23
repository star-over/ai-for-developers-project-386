# Дизайн: перестройка тестов по бизнес-доменам

Дата: 2026-04-23

## Цель

Реорганизовать тесты проекта: перегруппировать по бизнес-доменам, устранить дублирование через хелперы/фабрики, закрыть пробелы в покрытии edge cases. Внедрение максимально постепенное — каждый шаг оставляет тесты зелёными.

## Принципы внедрения

- **Один файл за раз** — каждый шаг: создать новый файл, убедиться что тесты проходят, удалить старый, снова убедиться. Никогда не ломать больше одного файла одновременно.
- **Сначала инфра, потом миграция, потом edge cases** — хелперы создаются первыми, затем тесты переезжают на хелперы, затем добавляются новые кейсы.
- **Рабочий код правится отдельно** — если новый тест обнаруживает проблему в production-коде, тест фиксирует текущее поведение (может быть skip/todo), а фикс кода делается отдельным шагом.
- **Каждый шаг — отдельный коммит** — можно откатить любой шаг без потери остальных.

---

## 1. Инфраструктура: `backend/tests/helpers.ts`

Новый файл, не тестовый — экспортирует фабрики и хелперы.

```typescript
export const createTestApp = async () => {
  const app = buildApp();
  await app.ready();
  return app;
};

export const createEventType = async ({
  app,
  name = 'Call',
  duration = 30,
}: { app; name?: string; duration?: number }) => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/event-types',
    payload: { name, duration },
  });
  return res.json();
};

export const createBooking = async ({
  app,
  eventTypeId,
  guestName = 'Alice',
  guestEmail = 'alice@test.com',
  startTime,
}: { app; eventTypeId: string; guestName?: string; guestEmail?: string; startTime: string }) => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/bookings',
    payload: { eventTypeId, guestName, guestEmail, startTime },
  });
  return { res, body: res.json() };
};
```

Паттерн использования во всех тестовых файлах:

```typescript
let app;
beforeEach(async () => { app = await createTestApp(); });
afterEach(async () => { await app.close(); });
```

---

## 2. Backend: структура файлов

### Было (6 файлов):
```
store.test.ts, event-types.test.ts, bookings.test.ts,
admin.test.ts, seed-data.test.ts, slots.test.ts
```

### Станет (4 тестовых + 1 хелпер):
```
backend/tests/
├── helpers.ts
├── scheduling.test.ts
├── event-types.test.ts
├── admin.test.ts
└── data-integrity.test.ts
```

### Удаляемые файлы:
- `store.test.ts` → поглощён `data-integrity.test.ts`
- `bookings.test.ts` → поглощён `scheduling.test.ts`
- `slots.test.ts` → поглощён `scheduling.test.ts`
- `seed-data.test.ts` → поглощён `data-integrity.test.ts`

---

## 3. `scheduling.test.ts` — домен «Расписание»

Объединяет слоты и бронирования. Источник: `slots.test.ts` + `bookings.test.ts`.

### `describe('Booking CRUD')`
- Создание с денормализованными полями (eventTypeName, duration, endTime)
- endTime вычисляется из duration eventType
- GET по id возвращает booking
- DELETE удаляет физически (повторный GET → 404)

### `describe('Booking Validation')`
Перенос + новое:
- Невалидный UUID в eventTypeId → 400
- Пустые обязательные поля → 400
- Невалидный email → 400
- Невалидный формат startTime → 400
- startTime не на 30-мин границе (09:15) → 400
- startTime вне рабочих часов (18:00) → 400
- 404 для несуществующего eventTypeId
- **Новое:** startTime `08:30` (до начала рабочего дня) → 400
- **Новое:** startTime `17:00` (граница WORK_END_HOUR, невалидно) → 400
- **Новое:** отсутствие startTime в payload → 400

### `describe('Slot Generation')`
- 16 слотов за день (09:00–16:30), все available
- Невалидные параметры: missing query, invalid date format, invalid UUID, non-existent eventTypeId → 400

### `describe('Slot Availability')`
Перенос + новое:
- Забронированный слот → `available: false`
- Глобальность — другой eventType тоже блокирует слот
- **Новое:** удалённый booking освобождает слот → `available: true`
- **Новое:** полностью забронированный день — 16 бронирований, все `available: false`
- Конфликт (409) при двойном бронировании

### `describe('Booking + EventType Interaction')`
- **Новое:** удаление eventType не удаляет его bookings (денормализация — booking хранит копию)

Итого: ~22 теста.

---

## 4. `event-types.test.ts` — домен «Типы событий»

### `describe('CRUD')`
- GET → пустой список
- POST → создаёт с id и createdAt
- PATCH → обновляет имя
- DELETE → удаляет, повторный → 404

### `describe('Validation')`
Перенос + новое:
- POST с невалидной duration (25) → 400
- POST с пустым именем → 400
- PATCH с невалидным UUID → 400
- PATCH с несуществующим id → 404
- **Новое:** PATCH с невалидной duration (`{ duration: 25 }`) → 400
- **Новое:** PATCH с пустым payload (`{}`) → 200 без изменений
- **Новое:** POST без обязательных полей (`{}`) → 400

### `describe('Health')`
- GET /api/health → 200 `{ status: 'ok' }`

Итого: ~11 тестов.

---

## 5. `admin.test.ts` — домен «Админка»

### `describe('Admin Bookings')`
Перенос + новое:
- Пустой список
- Сортировка по startTime
- **Новое:** ответ содержит денормализованные поля (eventTypeName, duration, endTime)
- **Новое:** удалённый booking не появляется в списке
- **Новое:** бронирования от разных eventType видны в общем списке

Итого: ~5 тестов.

---

## 6. `data-integrity.test.ts` — домен «Целостность данных»

Объединяет `store.test.ts` + `seed-data.test.ts` без изменений.

### `describe('Store')`
- Пустой store при `seed: false`
- JSONL seed загружается при `seed: true`
- Map-операции (set/get/delete)

### `describe('Seed Data')`
- Минимум 1 eventType и 1 booking в seed
- Каждая запись проходит Zod-схему
- Уникальность ID
- Bookings ссылаются на существующие eventTypes
- Денормализованные поля совпадают с источником

Итого: 6 тестов (без изменений).

---

## 7. Frontend: `frontend/src/lib/__tests__/`

### Было: `pure.test.ts` (7 тестов)
### Станет: `utils.test.ts` + `validation.test.ts`

Удаляемый файл: `pure.test.ts`.

### `utils.test.ts`

#### `describe('getDurationColors')`
Перенос + дополнение:
- duration 15 → sky
- duration 20 → emerald
- duration 30 → amber
- duration 60 → violet
- **Новое:** duration 10 (минимум) → sky
- **Новое:** проверка поля `border` (сейчас только `badge`)

#### `describe('formatDate')`
Полностью новый:
- Обычная дата → `20 апреля 2026 г.`
- Начало года → `1 января 2026 г.`
- Конец года → `31 декабря 2026 г.`

#### `describe('formatTime')`
Полностью новый:
- `09:00:00.000Z` → `09:00`
- `16:30:00.000Z` → `16:30`
- `00:00:00.000Z` → `00:00`

Итого: ~10 тестов.

### `validation.test.ts`

#### `describe('bookingSchema')`
Перенос + дополнение:
- Валидный input → success
- Пустое имя → fail
- Невалидный email → fail
- **Новое:** только пробелы в имени (`'   '`) — зафиксировать текущее поведение
- **Новое:** email без домена (`'alice@'`) → fail
- **Новое:** очень длинное имя (500 символов) — зафиксировать что проходит

#### `describe('eventTypeSchema')`
Перенос + дополнение:
- Валидный input → success
- Пустое имя → fail
- Невалидная duration (25) → fail
- **Новое:** параметризованный тест — все VALID_DURATIONS (10, 15, 20, 30) проходят
- **Новое:** duration = 0 → fail
- **Новое:** отрицательная duration (-15) → fail
- **Новое:** duration как строка ('30') → fail

Итого: ~8 тестов (было 3 + 3 = 6 в pure.test.ts, перенесённых + новые).

---

## 8. Порядок внедрения (постепенный)

Каждый шаг — отдельный коммит. Тесты зелёные после каждого шага.

### Фаза 1: Инфраструктура
1. Создать `backend/tests/helpers.ts`

### Фаза 2: Backend миграция (по одному файлу)
2. Создать `data-integrity.test.ts` (перенос store + seed-data) → удалить `store.test.ts`, `seed-data.test.ts`
3. Создать `scheduling.test.ts` (перенос bookings + slots, на хелперах) → удалить `bookings.test.ts`, `slots.test.ts`
4. Переписать `event-types.test.ts` на хелперах (файл остаётся, содержимое обновляется)
5. Переписать `admin.test.ts` на хелперах

### Фаза 3: Backend edge cases (по одному describe-блоку)
6. Добавить новые кейсы в `scheduling.test.ts`
7. Добавить новые кейсы в `event-types.test.ts`
8. Добавить новые кейсы в `admin.test.ts`

### Фаза 4: Frontend
9. Создать `utils.test.ts` (перенос getDurationColors + новые formatDate/formatTime)
10. Создать `validation.test.ts` (перенос + edge cases) → удалить `pure.test.ts`

### Фаза 5: Фиксы production-кода (если нужны)
11. Если какие-то новые тесты обнаружили неожиданное поведение (пробелы в имени, etc.) — исправить код отдельными коммитами

---

## Что НЕ меняется

- Конфиги vitest.config.ts, playwright.config.ts
- E2e тесты (booking-flow.spec.ts)
- Production-код (routes, store, validation) — кроме фиксов из фазы 5
- Makefile команды
- CI pipeline

## Итоговые числа

| Метрика | Было | Станет |
|---------|:----:|:------:|
| Тестовых файлов (backend) | 6 | 4 + helpers |
| Тестовых файлов (frontend) | 1 | 2 |
| Тестов (backend) | 34 | ~44 |
| Тестов (frontend) | 7 | ~18 |
| **Всего** | **41** | **~62** |
