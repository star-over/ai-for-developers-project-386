# Gotchas — нетривиальные детали реализации

Здесь собраны неочевидные особенности, которые были обнаружены в процессе разработки и ломают всё без ошибок компилятора.

---

## @mateothegreat/svelte5-router

### Нет синтаксиса `:param`
Роутер **не понимает** `:paramName` как синтаксис URL-параметров. Строка `/booking/:eventTypeId` — это литерал, не паттерн. Для параметрических маршрутов используй `RegExp` с именованными группами:

```ts
// ❌ Не работает — literal string, не матчит /booking/uuid
{ path: '/booking/:eventTypeId', component: Booking }

// ✅ Правильно — named capture group
{ path: /^\/booking\/(?<eventTypeId>[^/]+)$/, component: Booking }
```

Доступ к параметру в компоненте:
```ts
let { route } = $props(); // RouteResult
const eventTypeId = $derived(route?.result?.path?.params?.eventTypeId as string ?? '');
```

### Last-match-wins (последний совпавший маршрут побеждает)
Роутер проходит **все** маршруты и берёт **последний** успешный match, а не первый. Менее специфичные маршруты ставить **раньше**, более специфичные — **позже**:

```ts
const routes = [
  { path: '/', component: Home },
  { path: '/booking', component: EventTypes },       // base-match для /booking/*
  { path: '/admin', component: AdminBookings },      // base-match для /admin/*
  { path: '/admin/event-types', component: AdminEventTypes }, // точнее → победит над /admin
  { path: /^\/booking\/(?<eventTypeId>[^/]+)$/, component: Booking }, // точнее → победит над /booking
];
```

### base-match vs exact-match
- Строковые пути: `'/booking'` матчит `/booking` (exact) **и** `/booking/anything` (base-prefix)
- RegExp пути: матчится точно по регулярке

---

## Orval + @tanstack/svelte-query (Svelte 5)

### Параметры — функции, не объекты
Orval генерирует хуки для Svelte 5, где аргументы с параметрами — это **getter-функции** (`() => T`), а не просто объекты. Это нужно для реактивного отслеживания изменений.

```ts
// ❌ TypeError: params is not a function
createSlotsList({ date: selectedDate, eventTypeId })
createByIdGet(id)

// ✅ Правильно — getter fn
createSlotsList(() => ({ date: selectedDate, eventTypeId }))
createByIdGet(() => id)
```

Правило: если в сигнатуре Orval-хука написано `params: () => T` — оборачивай в стрелочную функцию.

### query.data — реактивный объект, не Svelte store
TanStack Query v6 для Svelte 5 возвращает **реактивный объект**, не Svelte 4 store. Не используй `$` префикс:

```svelte
<!-- ❌ store_invalid_shape -->
{#if $query.isPending}

<!-- ✅ Правильно -->
{#if query.isPending}
```

### Структура ответа: query.data.data
Orval оборачивает HTTP-ответ в `{ data, status, headers }`. Фактические данные — в `query.data.data`:

```svelte
<!-- API возвращает EventType[], но query.data = { data: EventType[], status: 200 } -->
{#each query.data.data as eventType (eventType.id)}
```

---

## Svelte 5 Runes

### `.svelte.ts` для файлов с рунами вне компонентов
Руны (`$state`, `$derived`, `$effect`) работают только в `.svelte` файлах **или** файлах с расширением `.svelte.ts` / `.svelte.js`. Обычный `.ts` упадёт с `rune_outside_svelte`:

```
// ❌ src/lib/stores/bookings.ts — rune_outside_svelte
// ✅ src/lib/stores/bookings.svelte.ts
```

Импортировать такие файлы тоже нужно с правильным расширением:
```ts
import { getBookingIds } from '$lib/stores/bookings.svelte.js'; // .svelte.js, не .js
```

ESLint тоже нужно настроить на парсинг `.svelte.ts`:
```js
// eslint.config.js
{ files: ['**/*.svelte.ts', '**/*.svelte.js'], languageOptions: { parser: ts.parser } }
```

---

## Vite HMR

### Кэш старых модулей после исправления ошибок
Если в браузере продолжают показываться старые ошибки после фикса — полный перезапуск dev-сервера сбрасывает кэш скомпилированных модулей:

```bash
pkill -f vite && make dev-frontend
```
