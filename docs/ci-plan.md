# CI GitHub Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Автоматическая проверка lint + typecheck + test + build при каждом push через GitHub Actions.

**Architecture:** Один workflow, один job. Все проверки делегируются `make check`. Версия Node фиксируется в `.nvmrc`.

**Tech Stack:** GitHub Actions, Make, Node 22 LTS

---

### Task 1: Создать `.nvmrc`

**Files:**
- Create: `.nvmrc`

- [x] **Step 1: Создать файл `.nvmrc`**

```
22
```

Одна строка, без переноса в конце.

- [x] **Step 2: Проверить, что nvm распознаёт**

Run: `cat .nvmrc`
Expected: `22`

- [x] **Step 3: Коммит**

```bash
git add .nvmrc
git commit -m "chore: pin Node 22 LTS in .nvmrc"
```

---

### Task 2: Добавить таргет `build` в Makefile

**Files:**
- Modify: `Makefile:30-56`

- [x] **Step 1: Добавить таргет `build` в секцию Quality**

После таргета `test-e2e` и перед таргетом `check`, добавить:

```makefile
build: ## Build frontend
	cd frontend && npm run build
```

- [x] **Step 2: Добавить `build` в `check`**

Заменить строку:

```makefile
check: lint typecheck test ## Full quality gate (pre-commit)
```

на:

```makefile
check: lint typecheck test build ## Full quality gate (pre-commit)
```

- [x] **Step 3: Добавить `build` в `.PHONY`**

Заменить строку:

```makefile
.PHONY: generate dev-frontend dev-backend mock lint lint-fix typecheck test test-e2e check help kill-frontend kill-backend kill-all
```

на:

```makefile
.PHONY: generate dev-frontend dev-backend mock lint lint-fix typecheck test test-e2e build check help kill-frontend kill-backend kill-all
```

- [x] **Step 4: Проверить, что `make build` работает**

Run: `make build`
Expected: Vite собирает бандл в `frontend/dist/` без ошибок.

- [x] **Step 5: Проверить, что `make check` включает build**

Run: `make check`
Expected: Последовательно выполняются lint → typecheck → test → build. Все шаги зелёные.

- [x] **Step 6: Коммит**

```bash
git add Makefile
git commit -m "chore: add build target to Makefile, include in check"
```

---

### Task 3: Создать CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [x] **Step 1: Создать файл `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches:
      - '**'

jobs:
  check:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
          cache-dependency-path: |
            package-lock.json
            frontend/package-lock.json
            backend/package-lock.json
            e2e/package-lock.json

      - name: Install root dependencies
        run: npm ci

      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Install backend dependencies
        run: cd backend && npm ci

      - name: Install e2e dependencies
        run: cd e2e && npm ci

      - name: Run quality checks
        run: make check
```

- [x] **Step 2: Валидация YAML-синтаксиса**

Run: `node -e "const fs = require('fs'); const y = require('yaml'); y.parse(fs.readFileSync('.github/workflows/ci.yml','utf8')); console.log('Valid YAML')"`

Если `yaml` недоступен, альтернатива:

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('Valid YAML')"`

Expected: `Valid YAML`

- [x] **Step 3: Коммит**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions quality gate workflow"
```

---

### Task 4: Интеграционная проверка

- [x] **Step 1: Убедиться, что все файлы на месте**

Run: `ls -la .nvmrc .github/workflows/ci.yml Makefile`
Expected: Все три файла существуют.

- [x] **Step 2: Полный прогон `make check`**

Run: `make check`
Expected: lint → typecheck → test → build — всё зелёное.

- [x] **Step 3: Очистить артефакты билда**

Run: `rm -rf frontend/dist`
