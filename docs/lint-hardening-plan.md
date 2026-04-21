# Lint Hardening — План усиления ESLint конфига

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Постепенно ужесточить ESLint конфиг, исправляя ошибки по ходу. От простого к сложному.

**Architecture:** Каждый шаг — один плагин/набор правил. После каждого шага: lint clean + tests green + commit + push.

**Tech Stack:** ESLint 10, flat config, typescript-eslint, eslint-plugin-svelte, eslint-plugin-tailwindcss, eslint-plugin-import-x

**Принцип уровней:**
- `error` — то, что ломает билд (баги, некорректный код)
- `warn` — стиль и форматирование (не блокирует билд, но нужно исправлять)

---

## Workflow для каждого шага

Каждый шаг выполняется по единому циклу:

1. Внедрить настройку (добавить правила в `eslint.config.js`)
2. Запустить `make lint` — собрать все ошибки и предупреждения
3. Исправить все `error` и `warn` в коде
4. Запустить `make check` — убедиться что lint + typecheck + test + build зелёные
5. Если тесты упали — исправить, при необходимости скорректировать правила линтера
6. Коммит и push

---

### Task 1: Встроенные правила ESLint (без установки пакетов)

**Files:**
- Modify: `eslint.config.js`

Добавить блок правил для всех файлов (`.ts`, `.js`, `.svelte`):

- [x] **Step 1: Добавить правила в `eslint.config.js`**

В массив конфига добавить объект с правилами:

```js
{
  rules: {
    'eqeqeq': 'error',
    'no-var': 'error',
    'prefer-const': 'warn',
    'no-console': 'warn',
    'no-unused-expressions': 'error',
  },
},
```

- [x] **Step 2: Запустить `make lint`, собрать ошибки**

Run: `make lint`
Зафиксировать список ошибок и предупреждений.

- [x] **Step 3: Исправить все найденные ошибки и предупреждения**

Пройтись по каждому файлу, исправить:
- `==` → `===`
- `var` → `let`/`const`
- `let` → `const` где нет переприсваивания
- `console.log` → удалить или заменить на logger
- Убрать неиспользуемые выражения

- [x] **Step 4: Убедиться что lint чист**

Run: `make lint`
Expected: 0 errors, 0 warnings.

- [x] **Step 5: Прогнать полную проверку**

Run: `make check`
Expected: lint + typecheck + test + build — всё зелёное.

- [x] **Step 6: Исправить проблемы если тесты упали**

Если `make check` упал — исправить код или скорректировать правила.

- [x] **Step 7: Коммит и push**

```bash
git add eslint.config.js <изменённые файлы>
git commit -m "chore(lint): add builtin ESLint rules (eqeqeq, no-var, prefer-const, no-console)"
git push
```

---

### Task 2: Ужесточение eslint-plugin-svelte

**Files:**
- Modify: `eslint.config.js`

Добавить строгие правила Svelte поверх `flat/recommended`:

- [x] **Step 1: Добавить правила для Svelte-файлов**

В блок `files: ['**/*.svelte']` добавить правила:

```js
{
  files: ['**/*.svelte'],
  rules: {
    'svelte/no-unused-svelte-ignore': 'error',
    'svelte/require-each-key': 'error',
    'svelte/no-reactive-reassign': 'warn',
    'svelte/no-target-blank': 'error',
    'svelte/no-at-html-tags': 'warn',
  },
},
```

- [x] **Step 2: Запустить `make lint`, собрать ошибки**

Run: `make lint`

- [x] **Step 3: Исправить все найденные ошибки и предупреждения**

- Добавить `key` в `{#each}` блоки где отсутствует
- Убрать ненужные `<!-- svelte-ignore -->` комментарии
- Добавить `rel="noopener noreferrer"` к ссылкам с `target="_blank"`

- [x] **Step 4: Убедиться что lint чист**

Run: `make lint`
Expected: 0 errors, 0 warnings.

- [x] **Step 5: Прогнать полную проверку**

Run: `make check`
Expected: всё зелёное.

- [x] **Step 6: Исправить проблемы если тесты упали**

- [x] **Step 7: Коммит и push**

```bash
git add eslint.config.js <изменённые файлы>
git commit -m "chore(lint): add strict Svelte rules (require-each-key, no-target-blank)"
git push
```

---

### Task 3: typescript-eslint strict

**Files:**
- Modify: `eslint.config.js`

Переключить с `recommended` на `strict`:

- [x] **Step 1: Переключить на strict конфиг**

Заменить:
```js
...ts.configs.recommended,
```
на:
```js
...ts.configs.strict,
```

- [x] **Step 2: Запустить `make lint`, собрать ошибки**

Run: `make lint`
Ожидаются новые ошибки: `no-explicit-any`, `no-non-null-assertion`, `no-unnecessary-condition` и др.

- [x] **Step 3: Исправить все найденные ошибки и предупреждения**

- Заменить `any` на конкретные типы
- Убрать `!` (non-null assertion) — добавить проверки
- Убрать лишние условия (`if (x)` где x всегда truthy)
- Для `frontend/src/lib/utils.ts` — утилитарные функции с `any` могут потребовать `eslint-disable` с комментарием

- [x] **Step 4: Убедиться что lint чист**

Run: `make lint`
Expected: 0 errors, 0 warnings.

- [x] **Step 5: Прогнать полную проверку**

Run: `make check`
Expected: всё зелёное.

- [x] **Step 6: Исправить проблемы если тесты упали**

Strict правила могут затронуть типы в тестах — исправить.

- [x] **Step 7: Коммит и push**

```bash
git add eslint.config.js <изменённые файлы>
git commit -m "chore(lint): switch typescript-eslint to strict config"
git push
```

---

### Task 4: eslint-plugin-tailwindcss

**Files:**
- Modify: `package.json` (root)
- Modify: `eslint.config.js`

- [x] **Step 1: Установить плагин**

```bash
npm i -D eslint-plugin-tailwindcss
```

- [x] **Step 2: Добавить конфиг в `eslint.config.js`**

Добавить импорт и правила:

```js
import tailwindcss from 'eslint-plugin-tailwindcss';
```

Добавить в массив конфига:

```js
...tailwindcss.configs['flat/recommended'],
{
  rules: {
    'tailwindcss/classnames-order': 'warn',
    'tailwindcss/no-contradicting-classname': 'error',
    'tailwindcss/no-custom-classname': 'off',
  },
  settings: {
    tailwindcss: {
      config: 'frontend/tailwind.config.js',
      callees: ['cn', 'clsx', 'tv'],
    },
  },
},
```

Примечание: `no-custom-classname` выключаем — shadcn-svelte использует кастомные классы. `callees` включает `cn`, `clsx`, `tv` (tailwind-variants) — плагин будет проверять классы внутри этих функций.

- [x] **Step 3: Запустить `make lint`, собрать ошибки**

Run: `make lint`
Ожидается много `classnames-order` warnings и возможно `no-contradicting-classname` errors.

- [x] **Step 4: Автофикс сортировки классов**

```bash
npx eslint . --fix
```

Это автоматически отсортирует классы Tailwind. Ручная правка нужна только для `no-contradicting-classname`.

- [x] **Step 5: Убедиться что lint чист**

Run: `make lint`
Expected: 0 errors, 0 warnings.

- [x] **Step 6: Прогнать полную проверку**

Run: `make check`
Expected: всё зелёное.

- [x] **Step 7: Исправить проблемы если тесты упали**

Сортировка классов не должна ломать тесты, но если тесты проверяют конкретные class-строки — обновить.

- [x] **Step 8: Коммит и push**

```bash
git add package.json package-lock.json eslint.config.js <изменённые файлы>
git commit -m "chore(lint): add eslint-plugin-tailwindcss (classnames-order, no-contradicting)"
git push
```

---

### Task 5: eslint-plugin-import-x

**Files:**
- Modify: `package.json` (root)
- Modify: `eslint.config.js`

- [x] **Step 1: Установить плагин**

```bash
npm i -D eslint-plugin-import-x
```

- [x] **Step 2: Добавить конфиг в `eslint.config.js`**

```js
import importX from 'eslint-plugin-import-x';
```

Добавить в массив конфига:

```js
{
  plugins: { 'import-x': importX },
  rules: {
    'import-x/no-duplicates': 'error',
    'import-x/no-cycle': ['error', { maxDepth: 3 }],
  },
},
```

- [x] **Step 3: Запустить `make lint`, собрать ошибки**

Run: `make lint`

- [x] **Step 4: Исправить найденные ошибки вручную**

- Дублирующиеся импорты — объединить
- Циклические зависимости — рефакторинг (вынести общий код)

- [x] **Step 5: Убедиться что lint чист**

Run: `make lint`
Expected: 0 errors, 0 warnings.

- [x] **Step 6: Прогнать полную проверку**

Run: `make check`
Expected: всё зелёное.

- [x] **Step 7: Исправить проблемы если тесты упали**

- [x] **Step 8: Коммит и push**

```bash
git add package.json package-lock.json eslint.config.js <изменённые файлы>
git commit -m "chore(lint): add eslint-plugin-import-x (no-duplicates, no-cycle)"
git push
```

---

### Task 6: Финальное ревью качества кода

После всех шагов — запустить полное ревью кода с помощью скила `requesting-code-review`.

- [x] **Step 1: Запустить `make check`**

Финальная проверка что всё зелёное.

- [x] **Step 2: Запустить скил code review**

Использовать `/requesting-code-review` для полного ревью качества кода по всему проекту.

- [x] **Step 3: Исправить найденные замечания**

- [x] **Step 4: Финальный коммит и push**
