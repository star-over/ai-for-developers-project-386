# E2E-тестирование: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Покрыть основной сценарий бронирования e2e-тестом (Playwright) — гость выбирает тип события, слот, заполняет форму, видит подтверждение.

**Architecture:** Отдельный пакет `e2e/` с Playwright. Конфиг `webServer` автоматически стартует backend и frontend через Makefile. Один тестовый файл с линейным сценарием через `test.step()`.

**Tech Stack:** Playwright, TypeScript, Chromium

**Спецификация:** `docs/e2e-design.md`

---

## Структура файлов

```
e2e/                          # создать
├── package.json              # создать — @playwright/test, typescript
├── playwright.config.ts      # создать — webServer, baseURL, chromium
├── tsconfig.json             # создать — минимальный TS-конфиг
└── tests/
    └── booking-flow.spec.ts  # создать — основной сценарий
```

---

## Task 1: Инициализация e2e-пакета

**Files:**
- Create: `e2e/package.json`
- Create: `e2e/tsconfig.json`

- [ ] **Step 1: Создать директорию и package.json**

```bash
mkdir -p e2e/tests
```

```json
// e2e/package.json
{
  "name": "e2e",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "devDependencies": {
    "@playwright/test": "^1.52.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: Создать tsconfig.json**

```json
// e2e/tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["tests/**/*.ts", "playwright.config.ts"]
}
```

- [ ] **Step 3: Установить зависимости и Chromium**

```bash
cd e2e && npm install
cd e2e && npx playwright install chromium
```

- [ ] **Step 4: Commit**

```bash
git add e2e/package.json e2e/package-lock.json e2e/tsconfig.json
git commit -m "chore: init e2e package with Playwright"
```

---

## Task 2: Конфигурация Playwright

**Files:**
- Create: `e2e/playwright.config.ts`

- [ ] **Step 1: Создать playwright.config.ts**

```typescript
// e2e/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'make -C .. dev-backend',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      command: 'make -C .. dev-frontend',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
  ],
});
```

Ключевое: `make -C ..` запускает Makefile из корня проекта, находясь в `e2e/`.

- [ ] **Step 2: Проверить что конфиг валиден**

```bash
cd e2e && npx playwright test --list
```

Ожидаемый результат: `No tests found` (тестов ещё нет, но конфиг парсится без ошибок).

- [ ] **Step 3: Commit**

```bash
git add e2e/playwright.config.ts
git commit -m "chore: add Playwright config with webServer"
```

---

## Task 3: Тест основного сценария бронирования

**Files:**
- Create: `e2e/tests/booking-flow.spec.ts`

**Контекст UI (точные селекторы):**
- Страница каталога `/booking`: заголовок `"Выберите тип встречи"`, карточки с именами типов (`"Quick Call"`, `"Consultation"`, `"Interview"`)
- Страница бронирования `/booking/:id`: календарь (Bits UI Calendar), слоты — кнопки с временем (формат `HH:MM`), занятые слоты `disabled`
- Клик по свободному слоту сразу открывает модалку (кнопки "Продолжить" нет)
- Форма: `input#guestName` (лейбл `"Ваше имя"`), `input#guestEmail` (лейбл `"Email"`), кнопка submit `"Записаться"`
- Успех: текст `"Бронирование создано!"` в зелёном блоке, через 1.5с redirect на `/`
- Seed event types: `"Quick Call"` (10 мин), `"Consultation"` (30 мин), `"Interview"` (20 мин)

- [ ] **Step 1: Написать тест**

```typescript
// e2e/tests/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test('гость бронирует слот', async ({ page }) => {
  await test.step('открыть каталог типов событий', async () => {
    await page.goto('/booking');
    await expect(page.getByRole('heading', { name: 'Выберите тип встречи' })).toBeVisible();
  });

  const eventCard = page.getByText('Consultation');

  await test.step('выбрать тип события', async () => {
    await expect(eventCard).toBeVisible();
    await eventCard.click();
    await expect(page).toHaveURL(/\/booking\/.+/);
  });

  await test.step('выбрать дату и слот', async () => {
    // Ждём загрузки слотов — кнопки с временем в формате HH:MM
    const slotButton = page.locator('button:not([disabled])').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await expect(slotButton).toBeVisible({ timeout: 10_000 });
    await slotButton.click();
  });

  await test.step('заполнить форму и забронировать', async () => {
    // Модалка открывается автоматически после выбора слота
    const nameInput = page.locator('#guestName');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Тест Юзер');
    await page.locator('#guestEmail').fill('test@example.com');
    await page.getByRole('button', { name: 'Записаться' }).click();
  });

  await test.step('увидеть подтверждение', async () => {
    await expect(page.getByText('Бронирование создано!')).toBeVisible();
  });
});
```

- [ ] **Step 2: Запустить тест**

```bash
make test-e2e
```

Ожидаемый результат: 1 passed.

Если тест падает — проанализировать скриншот ошибки в `e2e/test-results/`, поправить селекторы.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/booking-flow.spec.ts
git commit -m "test: e2e booking flow — guest books a slot"
```

---

## Task 4: Синхронизация с основным планом

**Files:**
- Modify: `docs/plan.md` (задача 22)

- [ ] **Step 1: Обновить задачу 22 в plan.md**

Заменить содержимое Task 22 на ссылку на отдельный план:

```markdown
## Task 22: E2E тесты (Playwright)

- [x] Реализовано по отдельному плану: `docs/e2e-plan.md`
- [x] Спецификация: `docs/e2e-design.md`
```

- [ ] **Step 2: Commit**

```bash
git add docs/plan.md docs/e2e-plan.md docs/e2e-design.md
git commit -m "docs: add e2e test plan, link from main plan task 22"
```
