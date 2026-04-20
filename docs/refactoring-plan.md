# План рефакторинга по результатам code review

Дата: 2026-04-20

## Контекст

Полное ревью качества кодовой базы (backend + frontend) выявило ~15 находок.
Принято решение реализовать группы 1 + 2 + ResponsiveModal.

## 1. Баги и корректность

### 1.1 Фикс endTime в bookings

- **Файл:** `backend/src/routes/bookings.ts:45`
- **Проблема:** `endTime` считается как `startTime + SLOT_DURATION(30)` вместо `startTime + eventType.duration`. Бронирование 15-минутного события показывает `endTime` через 30 минут.
- **Решение:** заменить `SLOT_DURATION * 60 * 1000` на `eventType.duration * 60 * 1000`.
- **Тест:** добавить тест для короткого события (duration=15), проверить `endTime = startTime + 15 мин`.

### 1.2 Комментарий к SLOT_DURATION

- **Файл:** после рефакторинга — `backend/src/constants.ts`
- **Решение:** добавить комментарий, объясняющий что сетка всегда 30-минутная и любое событие занимает слот целиком вне зависимости от `duration`.

### 1.3 Захардкоженные строки мимо i18n

| Файл | Строка | Сейчас | Решение |
|------|--------|--------|---------|
| `frontend/src/pages/Booking.svelte` | :62 | `мин` | `t.eventTypes.minutes` |
| `frontend/src/pages/AdminEventTypes.svelte` | :120 | `Нет типов событий` | новый ключ `t.admin.eventTypes.empty` |
| `frontend/src/pages/AdminEventTypes.svelte` | :183 | `мин` | `t.eventTypes.minutes` |
| `frontend/src/lib/components/SlotPicker.svelte` | :131 | `Нет доступных слотов` | новый ключ `t.booking.slotsEmpty` |

### 1.4 Email input type

- **Файл:** `frontend/src/lib/components/BookingForm.svelte:93`
- **Проблема:** `type="text"` — теряются подсказки браузера, мобильная клавиатура без `@`.
- **Решение:** `type="email"`.

## 2. DRY-рефакторинг бэкенда

### 2.1 Вынести константы в constants.ts

- **Новый файл:** `backend/src/constants.ts`
- **Содержимое:** `SLOT_DURATION` (с комментарием из п.1.2), `WORK_START_HOUR`, `WORK_END_HOUR`.
- **Затронутые файлы:** `bookings.ts`, `slots.ts` — удалить локальные константы, импортировать из `constants.ts`.

### 2.2 Хелпер parseIdParam

- **Файл:** `backend/src/validation.ts`
- **Сигнатура:** `parseIdParam({ params, reply }): Promise<string | null>` — парсит `IdParamSchema`, при ошибке отправляет 400, возвращает `null`.
- **Затронутые файлы:** `bookings.ts` (2 места), `event-types.ts` (2 места) — заменить 4-строчные блоки валидации на `const id = await parseIdParam({ params: request.params, reply }); if (!id) return;`.

## 3. DRY-рефакторинг фронтенда

### 3.1 Shared isDesktop store

- **Новый файл:** `frontend/src/lib/stores/mediaQuery.svelte.ts`
- **Экспорт:** `getIsDesktop()` — реактивная функция (Svelte 5 rune), один resize-listener на всё приложение.
- **Убирает дублирование из:** `Booking.svelte`, `AdminEventTypes.svelte`, `BookingCard.svelte` (3 копии по ~7 строк).

### 3.2 Duration colors утилита

- **Файл:** `frontend/src/lib/utils.ts`
- **Функция:** `getDurationColors({ duration }): { border: string; badge: string }` — маппинг длительности на Tailwind-классы.
- **Убирает дублирование из:** `BookingCardContent.svelte`, `EventTypeCardContent.svelte`.

### 3.3 onCanceled optional в BookingCard

- **Файл:** `frontend/src/lib/components/BookingCard.svelte:14`
- **Решение:** `onCanceled?: () => void`, вызов через `onCanceled?.()`.
- **Следствие:** в `MyBookings.svelte:17` убрать `onCanceled={() => {}}`.

## 4. ResponsiveModal компонент

- **Новый файл:** `frontend/src/lib/components/ResponsiveModal.svelte`
- **Props:** `open: boolean`, `onOpenChange: (open: boolean) => void`, `title: string`, `description?: string`
- **Snippets:** `children` (body), `footer`
- **Поведение:** desktop (>= 768px) — `Dialog.*`, mobile — `Sheet.*` с `side="bottom"`. Использует `getIsDesktop()` из п.3.1.
- **Убирает дублирование из:** `Booking.svelte`, `AdminEventTypes.svelte` (x2), `BookingCard.svelte`.

## 5. Тесты

- Обновить `backend/tests/bookings.test.ts` — добавить тест: создать event type с `duration: 15`, забронировать, проверить что `endTime = startTime + 15 мин`.
- Существующий тест с `duration: 30` остаётся корректным.
- После всех изменений — `make check` (lint + typecheck + test).

## Отложено

| Находка | Причина |
|---------|---------|
| N+1 в MyBookings (каждый BookingCard — отдельный GET) | При <10 бронированиях незаметно. Потребуется новый batch endpoint. |
| QueryError компонент (3 копии error-блока) | 4 строки — ниже порога абстракции. |

## Порядок реализации

1. Backend: constants.ts + parseIdParam + фикс endTime + тест
2. Frontend: mediaQuery store + getDurationColors + onCanceled optional
3. Frontend: ResponsiveModal + рефакторинг 4 мест
4. Frontend: i18n фиксы + email type
5. `make check` — финальная проверка
