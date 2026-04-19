# Frontend — План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать полнофункциональный SPA-фронтенд на Svelte 5 с Prism mock-сервером. Минимальный вертикальный срез первым — scaffolding + Orval + одна страница end-to-end, потом наращивание.

**Tech Stack:** Svelte 5 (runes), Vite, Tailwind 4, shadcn-svelte, @tanstack/svelte-query, @mateothegreat/svelte5-router, Orval, Zod, lucide-svelte.

**API:** OpenAPI spec `spec/tsp-output/@typespec/openapi3/openapi.yaml`, mock через Prism (`make mock`).

**UI paradigm:** Mobile-first. Drawer-навигация (hamburger → Sheet). Bottom bar не используем.

**Specs:** `docs/spec.md`, `docs/architecture.md`

---

## Порядок задач

| # | Задача | Зависит от |
|---|--------|-----------|
| F1 | Frontend scaffolding + Vite + Tailwind | — |
| F2 | Orval кодогенерация | F1 |
| F3 | Layout + Drawer-навигация + роутинг | F1 |
| F4 | ESLint настройка | F1 |
| F5 | Каталог типов событий (/booking) | F2, F3, F4 |
| F6 | i18n строки | F1 |
| F7 | Страница бронирования (/booking/:eventTypeId) | F2, F3, F4, F6 |
| F8 | Админка — предстоящие встречи (/admin) | F2, F3, F4, F6 |
| F9 | Админка — CRUD типов событий (/admin/event-types) | F2, F3, F4, F6 |
| F10 | Мои записи (LocalStorage) | F2, F3, F4, F6 |
| F11 | Главная страница (/) | F3, F4, F6 |

**Подход:** Задача F5 (каталог) — минимальный вертикальный срез. Валидирует весь стек: Vite → Orval → TanStack Query → Prism mock → рендеринг. После F5 стек проверен, остальные страницы строятся на готовой инфраструктуре.

**Lint gate:** ESLint (F4) внедряется до первой страницы. Начиная с F5, каждый коммит обязан проходить `make lint` с нулём errors И warnings. Warnings допустимы только в процессе разработки, перед коммитом — всё чисто. Перед каждым `git commit` выполнять:

```bash
make lint  # 0 errors, 0 warnings — обязательно
```

---

## File Map

```
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── orval.config.ts
├── index.html
├── src/
│   ├── main.ts                          # mount App, QueryClient
│   ├── app.css                          # Tailwind directives
│   ├── App.svelte                       # Router + QueryClientProvider
│   ├── lib/
│   │   ├── api/                         # Orval-generated (автогенерация, НЕ трогать руками)
│   │   ├── i18n/
│   │   │   └── index.ts                 # Все строки UI (единый объект)
│   │   ├── stores/
│   │   │   └── bookings.ts              # LocalStorage store для "Мои записи"
│   │   ├── validation/
│   │   │   └── schemas.ts               # Zod-схемы (.describe() + custom errors)
│   │   └── components/
│   │       ├── ui/                      # shadcn-svelte (button, card, input, sheet...)
│   │       ├── Layout.svelte            # Top bar + Drawer + <slot />
│   │       ├── SlotPicker.svelte        # Горизонтальная лента дат + сетка слотов
│   │       ├── BookingForm.svelte       # Форма: имя + email, Zod-валидация
│   │       └── MyBookings.svelte        # Список бронирований из LocalStorage
│   └── pages/
│       ├── Home.svelte                  # Лендинг
│       ├── EventTypes.svelte            # Каталог типов событий (/booking)
│       ├── Booking.svelte               # Страница бронирования (/booking/:id)
│       ├── AdminBookings.svelte         # Предстоящие встречи (/admin)
│       └── AdminEventTypes.svelte       # CRUD типов событий (/admin/event-types)
```

---

## Task F1: Frontend scaffolding + Vite + Tailwind

**Files:** Все файлы в `frontend/`

- [ ] **Step 1: Инициализировать проект**

```bash
mkdir -p frontend/src/lib/{api,i18n,stores,validation,components/ui} frontend/src/pages
cd frontend && npm init -y
```

- [ ] **Step 2: Установить зависимости**

```bash
cd frontend && npm install svelte @sveltejs/vite-plugin-svelte vite tailwindcss @tailwindcss/vite
cd frontend && npm install @tanstack/svelte-query @mateothegreat/svelte5-router zod lucide-svelte
cd frontend && npm install -D typescript @tsconfig/svelte orval
```

- [ ] **Step 3: Создать vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4010',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4: Создать tsconfig.json**

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 5: Создать index.html**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Calendar — Запись на звонок</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 6: Создать src/app.css**

```css
@import "tailwindcss";
```

- [ ] **Step 7: Создать src/main.ts**

```typescript
import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
```

- [ ] **Step 8: Создать src/App.svelte (заглушка)**

```svelte
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
  <main class="min-h-screen bg-background text-foreground">
    <h1 class="text-2xl p-4">Calendar — scaffolding works!</h1>
  </main>
</QueryClientProvider>
```

- [ ] **Step 9: Добавить scripts в package.json**

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 10: Настроить shadcn-svelte**

```bash
cd frontend && npx shadcn-svelte@latest init
```

Добавить нужные компоненты:
```bash
npx shadcn-svelte@latest add button card input sheet dialog badge
```

- [ ] **Step 11: Запустить и проверить**

```bash
cd frontend && npx vite dev
# Открыть http://localhost:5173 — должен показать заголовок
```

- [ ] **Step 12: Commit**

```bash
git add frontend/
git commit -m "feat: frontend scaffolding with Svelte 5, Vite, Tailwind 4, shadcn-svelte"
```

---

## Task F2: Orval кодогенерация

**Files:**
- Create: `frontend/orval.config.ts`

- [ ] **Step 1: Создать orval.config.ts**

```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  calendar: {
    input: {
      target: '../spec/tsp-output/@typespec/openapi3/openapi.yaml',
    },
    output: {
      mode: 'tags-split',
      target: './src/lib/api',
      schemas: './src/lib/api/model',
      client: 'svelte-query',
      override: {
        mutator: undefined,
        query: {
          useQuery: true,
        },
      },
    },
  },
});
```

- [ ] **Step 2: Сгенерировать API-хуки**

```bash
cd frontend && npx orval
```

Проверить что в `src/lib/api/` появились файлы с хуками для каждой группы эндпоинтов.

- [ ] **Step 3: Проверить что `make generate` работает**

```bash
make generate
```

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: Orval code generation for TanStack Query hooks from OpenAPI"
```

---

## Task F3: Layout + Drawer-навигация + роутинг

**Files:**
- Create: `frontend/src/lib/components/Layout.svelte`
- Modify: `frontend/src/App.svelte`

- [ ] **Step 1: Создать Layout.svelte с drawer-навигацией**

Структура:
```
┌──────────────────────────┐
│ ☰  Calendar              │  ← compact top bar (48px)
├──────────────────────────┤
│                          │
│       <slot />           │
│                          │
└──────────────────────────┘
```

Drawer (Sheet side="left"):
```
┌──────────┐
│ ╳ Calendar│
│           │
│ Главная   │  → /
│ Запись    │  → /booking
│ ──────────│
│ Встречи   │  → /admin
│ Типы      │  → /admin/event-types
│ событий   │
└──────────┘
```

Ключевые моменты:
- shadcn-svelte `Sheet` side="left"
- Иконки из `lucide-svelte`: Menu (бургер), X (закрыть), Home, Calendar, List, Settings
- Top bar: `position: sticky; top: 0`, бургер + логотип "Calendar"
- Touch target ≥ 44px на всех элементах навигации
- Группировка: гостевые ссылки | разделитель | админские ссылки
- Тап на ссылку → закрыть drawer + навигация
- Активная ссылка подсвечивается
- На md:+ — тот же drawer (консистентно для MVP)

- [ ] **Step 2: Обновить App.svelte — роутер + Layout**

```svelte
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { Router } from '@mateothegreat/svelte5-router';
  import Layout from './lib/components/Layout.svelte';
  import Home from './pages/Home.svelte';
  import EventTypes from './pages/EventTypes.svelte';
  import Booking from './pages/Booking.svelte';
  import AdminBookings from './pages/AdminBookings.svelte';
  import AdminEventTypes from './pages/AdminEventTypes.svelte';

  const queryClient = new QueryClient();

  const routes = [
    { path: '/', component: Home },
    { path: '/booking', component: EventTypes },
    { path: '/booking/:eventTypeId', component: Booking },
    { path: '/admin', component: AdminBookings },
    { path: '/admin/event-types', component: AdminEventTypes },
  ];
</script>

<QueryClientProvider client={queryClient}>
  <Layout>
    <Router {routes} />
  </Layout>
</QueryClientProvider>
```

- [ ] **Step 3: Создать страницы-заглушки**

Для каждой страницы (`Home.svelte`, `EventTypes.svelte`, `Booking.svelte`, `AdminBookings.svelte`, `AdminEventTypes.svelte`) — минимальная заглушка с заголовком.

- [ ] **Step 4: Проверить навигацию**

```bash
make mock &   # Prism на :4010
cd frontend && npx vite dev
# Открыть http://localhost:5173 — проверить все роуты через drawer
```

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: Layout with drawer navigation and SPA routing"
```

---

## Task F4: ESLint настройка

**Files:**
- Create: `eslint.config.js` (корень проекта, единый flat config)

- [ ] **Step 1: Установить зависимости**

```bash
npm install -D eslint @eslint/js eslint-plugin-svelte typescript-eslint globals
```

- [ ] **Step 2: Создать eslint.config.js (flat config)**

Единый конфиг в корне проекта:
- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-plugin-svelte` recommended
- Игнорировать: `node_modules`, `dist`, `frontend/src/lib/api/` (Orval-generated), `spec/tsp-output/`
- Политика: errors — то, что ломает билд; warnings — стиль и форматирование. Перед коммитом и errors, и warnings должны быть на нуле

- [ ] **Step 3: Проверить что `make lint` проходит на текущем коде**

```bash
make lint
```

Ожидаемый результат: 0 errors (warnings допустимы).

- [ ] **Step 4: Добавить lint check в Vite workflow**

В `frontend/package.json` добавить скрипт:
```json
{
  "scripts": {
    "lint": "eslint src/",
    "prebuild": "npm run lint"
  }
}
```

`prebuild` гарантирует что `vite build` не пройдёт с lint errors.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js package.json frontend/package.json
git commit -m "feat: ESLint 9 flat config with Svelte + TypeScript support"
```

---

## Task F5: Каталог типов событий (/booking) — вертикальный срез

> **Минимальный вертикальный срез** — валидация всего стека: Orval → TanStack Query → Prism mock → рендеринг.
> Перед коммитом: `make lint` — 0 errors, 0 warnings.

**Files:**
- Modify: `frontend/src/pages/EventTypes.svelte`

- [ ] **Step 1: Реализовать EventTypes.svelte**

Содержимое:
- Профиль владельца: аватар (заглушка/инициалы), имя, подпись "Host"
- Список карточек типов событий (shadcn Card)
- Каждая карточка: название, бейдж длительности ("30 мин"), стрелка →
- Тап на карточку → `/booking/:eventTypeId`

API:
- `GET /api/event-types` через Orval-generated хук

Состояния:
- Загрузка: skeleton-карточки
- Пусто: "Нет доступных событий"
- Ошибка: сообщение + кнопка "Повторить"

Mobile-first:
- Карточки на всю ширину, вертикальный стек
- Touch-friendly: вся карточка кликабельна, min-height 44px

- [ ] **Step 2: Запустить с Prism и проверить**

```bash
make mock &
cd frontend && npx vite dev
# /booking — должны отображаться карточки с mock-данными от Prism
```

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: event types catalog page with Orval + TanStack Query"
```

---

## Task F6: i18n строки

**Files:**
- Create: `frontend/src/lib/i18n/index.ts`

- [ ] **Step 1: Создать файл строк**

Все UI-строки в одном типизированном объекте. Группировка по страницам/компонентам:

```typescript
export const t = {
  nav: {
    home: 'Главная',
    booking: 'Запись',
    adminBookings: 'Встречи',
    adminEventTypes: 'Типы событий',
    brand: 'Calendar',
  },
  home: {
    title: 'Запись на звонок',
    subtitle: 'Выберите удобное время для встречи',
    cta: 'Записаться',
  },
  eventTypes: {
    title: 'Выберите тип встречи',
    empty: 'Нет доступных событий',
    minutes: 'мин',
  },
  booking: {
    selectDate: 'Выберите дату',
    selectSlot: 'Выберите время',
    slotFree: 'Свободно',
    slotTaken: 'Занято',
    continue: 'Продолжить',
    form: {
      name: 'Ваше имя',
      email: 'Email',
      submit: 'Записаться',
      namePlaceholder: 'Введите имя',
      emailPlaceholder: 'mail@example.com',
    },
    success: 'Бронирование создано!',
    conflict: 'Слот уже занят, выберите другое время',
  },
  admin: {
    bookings: {
      title: 'Предстоящие встречи',
      empty: 'Нет предстоящих встреч',
    },
    eventTypes: {
      title: 'Типы событий',
      create: 'Создать',
      edit: 'Редактировать',
      delete: 'Удалить',
      confirmDelete: 'Удалить тип события?',
      form: {
        name: 'Название',
        duration: 'Длительность',
        namePlaceholder: 'Название события',
        save: 'Сохранить',
        cancel: 'Отмена',
      },
    },
  },
  myBookings: {
    title: 'Мои записи',
    empty: 'У вас нет записей',
    cancel: 'Отменить',
    confirmCancel: 'Отменить запись?',
  },
  common: {
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    retry: 'Повторить',
  },
} as const;
```

- [ ] **Step 2: Заменить хардкоженные строки в Layout.svelte и EventTypes.svelte на t.*

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: centralized i18n strings for all UI text"
```

---

## Task F7: Страница бронирования (/booking/:eventTypeId)

**Files:**
- Create: `frontend/src/lib/components/SlotPicker.svelte`
- Create: `frontend/src/lib/components/BookingForm.svelte`
- Create: `frontend/src/lib/validation/schemas.ts`
- Modify: `frontend/src/pages/Booking.svelte`

- [ ] **Step 1: Создать Zod-схемы (validation/schemas.ts)**

```typescript
import { z } from 'zod';

export const bookingSchema = z.object({
  guestName: z
    .string()
    .min(1, 'Имя обязательно')
    .describe('Имя гостя для бронирования'),
  guestEmail: z
    .string()
    .email('Некорректный email')
    .describe('Email гостя для подтверждения бронирования'),
});
```

- [ ] **Step 2: Создать SlotPicker.svelte**

Две части:
1. **DatePicker** — горизонтальная лента 14 дней, свайп/скролл. Каждый элемент: день недели + число. Выбранная дата подсвечена.
2. **Сетка слотов** — кнопки "09:00", "09:30"... Свободные — primary, занятые — disabled/muted. Выбранный — accent/outline.

API: `GET /api/slots?date=YYYY-MM-DD&eventTypeId=...`

Время: отображать в локальной таймзоне пользователя (конверсия из UTC).

Props: `eventTypeId: string`. Events: `onSlotSelect(startTime: string)`.

- [ ] **Step 3: Создать BookingForm.svelte**

- Два поля: имя + email
- Zod-валидация на submit (показ ошибок под полями)
- Props: `eventTypeId: string, startTime: string`
- API: `POST /api/bookings`
- Успех → toast + сохранить ID в LocalStorage → redirect `/booking`
- 409 → показать ошибку "Слот уже занят"

- [ ] **Step 4: Реализовать Booking.svelte**

Собирает компоненты вместе:
1. Инфо о типе события (название, длительность) — запрос `GET /api/event-types` + фильтр по ID, или данные из роута
2. SlotPicker → выбор даты и слота
3. BookingForm → появляется после выбора слота

Вертикальный scroll, без wizard/пагинации.

- [ ] **Step 5: Проверить с Prism**

```bash
make mock &
cd frontend && npx vite dev
# /booking/:id — полный flow: дата → слот → форма → submit
```

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: booking page with date picker, slot selection, and booking form"
```

---

## Task F8: Админка — предстоящие встречи (/admin)

**Files:**
- Modify: `frontend/src/pages/AdminBookings.svelte`

- [ ] **Step 1: Реализовать AdminBookings.svelte**

- Список карточек предстоящих встреч
- API: `GET /api/admin/bookings`
- Каждая карточка: название события, длительность, имя гостя, email, дата/время
- Пустое состояние: "Нет предстоящих встреч"
- Время в локальной таймзоне

- [ ] **Step 2: Проверить с Prism**

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: admin upcoming bookings page"
```

---

## Task F9: Админка — CRUD типов событий (/admin/event-types)

**Files:**
- Modify: `frontend/src/pages/AdminEventTypes.svelte`

- [ ] **Step 1: Реализовать AdminEventTypes.svelte**

- Список типов событий + кнопка "Создать"
- API: `GET /api/event-types`
- Каждая карточка: название, бейдж длительности, кнопки "Редактировать" / "Удалить"
- Создание/редактирование: Sheet снизу (mobile-friendly modal)
  - Поля: название (input), длительность (select: 10/15/20/30)
  - Zod-валидация
  - API: `POST /api/event-types` или `PATCH /api/event-types/:id`
- Удаление: Dialog с подтверждением → `DELETE /api/event-types/:id`
- После мутации: инвалидация query (TanStack Query)

- [ ] **Step 2: Проверить с Prism**

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: admin event types CRUD with create/edit sheet and delete dialog"
```

---

## Task F10: Мои записи (LocalStorage)

**Files:**
- Create: `frontend/src/lib/stores/bookings.ts`
- Create: `frontend/src/lib/components/MyBookings.svelte`

- [ ] **Step 1: Создать LocalStorage store (stores/bookings.ts)**

```typescript
// Хранит массив booking IDs в LocalStorage
// API: addBookingId(id), removeBookingId(id), getBookingIds()
// Реактивный через $state (Svelte 5 runes)
```

- [ ] **Step 2: Создать MyBookings.svelte**

- Читает IDs из store
- По каждому: `GET /api/bookings/:id` (параллельные запросы)
- Если 404 → убрать из LocalStorage (бронирование не существует)
- Карточка: название события, дата/время, кнопка "Отменить"
- Отмена: Dialog подтверждения → `DELETE /api/bookings/:id` → убрать из списка и LocalStorage
- Пустое состояние: "У вас нет записей"

- [ ] **Step 3: Встроить MyBookings в UI**

Доступ через drawer-навигацию или блок на странице `/booking`.

- [ ] **Step 4: Проверить с Prism**

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: my bookings component with LocalStorage persistence"
```

---

## Task F11: Главная страница (/)

**Files:**
- Modify: `frontend/src/pages/Home.svelte`

- [ ] **Step 1: Реализовать Home.svelte**

Лендинг:
- Профиль владельца: аватар, имя, подпись "Host"
- Заголовок: "Запись на звонок"
- Описание сервиса (1-2 предложения)
- CTA-кнопка "Записаться" → `/booking`
- Mobile-first: вертикальный layout, крупная кнопка, отступы

- [ ] **Step 2: Commit**

```bash
git add frontend/
git commit -m "feat: landing page with host profile and CTA"
```
