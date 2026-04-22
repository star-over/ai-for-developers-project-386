# Visual Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Превратить монохромный шаблонный UI в запоминающийся mobile-first интерфейс с brand-identity, понятной навигацией и визуальной иерархией.

**Architecture:** Изменения идут слоями: сначала design tokens (цвета, шрифты) в CSS variables, затем navigation (bottom tab bar), потом компоненты (слоты, карточки), далее анимации. Каждая фаза — независимый deployable increment.

**Tech Stack:** Svelte 5, Tailwind 4, shadcn-svelte, OKLch colors, Lucide icons, @fontsource

---

## File Map

| File | Role | Changes |
|------|------|---------|
| `frontend/src/app.css` | Design tokens, font imports | Brand palette, display font, animation keyframes |
| `frontend/src/lib/components/Layout.svelte` | Navigation shell | Bottom tab bar (mobile), remove hamburger |
| `frontend/src/lib/components/SlotPicker.svelte` | Date + time selection | Disabled slot styling, time-of-day grouping |
| `frontend/src/lib/components/EventTypeCardContent.svelte` | Event type card inner | Compact layout |
| `frontend/src/pages/Home.svelte` | Landing page | Gradient bg, stagger animation, better empty state |
| `frontend/src/pages/EventTypes.svelte` | Event type list | Compact cards, stagger animation |
| `frontend/src/pages/Booking.svelte` | Booking flow | Spacing tweaks |
| `frontend/src/pages/AdminBookings.svelte` | Admin bookings | Stagger animation |
| `frontend/src/pages/AdminEventTypes.svelte` | Admin event types | Compact cards, stagger |
| `frontend/src/lib/components/BookingForm.svelte` | Booking form | Success animation |
| `frontend/src/lib/components/BookingCardContent.svelte` | Booking card inner | Compact layout |
| `frontend/src/lib/i18n/index.ts` | Translations | New keys for time-of-day labels |
| `frontend/package.json` | Dependencies | Display font package |

---

## Phase 1: Design Tokens — Brand Palette + Display Font

### Task 1.1: Install display font

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install @fontsource-variable/playfair-display**

```bash
cd /Users/belan/PROJECTS/Hexlet_llm/frontend && npm install -D @fontsource-variable/playfair-display
```

- [ ] **Step 2: Verify installation**

```bash
ls node_modules/@fontsource-variable/playfair-display/index.css
```

Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): add Playfair Display variable font"
```

### Task 1.2: Brand color palette + font setup

**Files:**
- Modify: `frontend/src/app.css`

- [ ] **Step 1: Add font import and CSS custom properties for brand**

In `frontend/src/app.css`, add the Playfair Display import after the Geist import:

```css
@import "@fontsource-variable/playfair-display";
```

- [ ] **Step 2: Replace `:root` color variables with warm brand palette**

Replace the entire `:root` block with:

```css
:root {
  --background: oklch(0.985 0.005 80);
  --foreground: oklch(0.25 0.01 60);
  --card: oklch(0.97 0.003 80);
  --card-foreground: oklch(0.25 0.01 60);
  --popover: oklch(0.985 0.005 80);
  --popover-foreground: oklch(0.25 0.01 60);
  --primary: oklch(0.637 0.137 162);
  --primary-foreground: oklch(0.985 0.005 80);
  --secondary: oklch(0.95 0.01 80);
  --secondary-foreground: oklch(0.25 0.01 60);
  --muted: oklch(0.95 0.008 80);
  --muted-foreground: oklch(0.5 0.01 60);
  --accent: oklch(0.72 0.15 55);
  --accent-foreground: oklch(0.25 0.01 60);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.9 0.01 80);
  --input: oklch(0.9 0.01 80);
  --ring: oklch(0.637 0.137 162);
  --chart-1: oklch(0.637 0.137 162);
  --chart-2: oklch(0.72 0.15 55);
  --chart-3: oklch(0.55 0.12 162);
  --chart-4: oklch(0.45 0.12 162);
  --chart-5: oklch(0.35 0.08 162);
  --radius: 0.625rem;
  --sidebar: oklch(0.975 0.005 80);
  --sidebar-foreground: oklch(0.25 0.01 60);
  --sidebar-primary: oklch(0.637 0.137 162);
  --sidebar-primary-foreground: oklch(0.985 0.005 80);
  --sidebar-accent: oklch(0.937 0.04 162);
  --sidebar-accent-foreground: oklch(0.25 0.01 60);
  --sidebar-border: oklch(0.9 0.01 80);
  --sidebar-ring: oklch(0.637 0.137 162);
}
```

Key changes:
- `--primary` → teal `oklch(0.637 0.137 162)` (was gray)
- `--accent` → amber `oklch(0.72 0.15 55)` (was gray)
- `--background` → cream `oklch(0.985 0.005 80)` (was pure white)
- `--foreground` → warm dark `oklch(0.25 0.01 60)` (was pure black)
- `--ring` → brand teal (was gray)
- All sidebar colors → brand-aware

- [ ] **Step 3: Update `.dark` block**

Replace the entire `.dark` block with:

```css
.dark {
  --background: oklch(0.17 0.01 60);
  --foreground: oklch(0.95 0.005 80);
  --card: oklch(0.22 0.01 60);
  --card-foreground: oklch(0.95 0.005 80);
  --popover: oklch(0.22 0.01 60);
  --popover-foreground: oklch(0.95 0.005 80);
  --primary: oklch(0.7 0.12 162);
  --primary-foreground: oklch(0.17 0.01 60);
  --secondary: oklch(0.27 0.01 60);
  --secondary-foreground: oklch(0.95 0.005 80);
  --muted: oklch(0.27 0.01 60);
  --muted-foreground: oklch(0.65 0.01 60);
  --accent: oklch(0.75 0.13 55);
  --accent-foreground: oklch(0.17 0.01 60);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.7 0.12 162);
  --chart-1: oklch(0.7 0.12 162);
  --chart-2: oklch(0.75 0.13 55);
  --chart-3: oklch(0.55 0.1 162);
  --chart-4: oklch(0.45 0.08 162);
  --chart-5: oklch(0.35 0.06 162);
  --sidebar: oklch(0.22 0.01 60);
  --sidebar-foreground: oklch(0.95 0.005 80);
  --sidebar-primary: oklch(0.7 0.12 162);
  --sidebar-primary-foreground: oklch(0.95 0.005 80);
  --sidebar-accent: oklch(0.27 0.01 60);
  --sidebar-accent-foreground: oklch(0.95 0.005 80);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.7 0.12 162);
}
```

- [ ] **Step 4: Add display font to `@theme inline` block**

Inside the `@theme inline` block, add after `--font-sans`:

```css
--font-display: 'Playfair Display Variable', serif;
```

- [ ] **Step 5: Add animation keyframes at the end of app.css (before closing)**

Add after the `@layer base` block:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-check {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@utility animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out both;
}

@utility animate-scale-check {
  animation: scale-check 0.4s ease-out both;
}
```

Note: the `@layer base` block already exists — the keyframes and utilities go AFTER it (replace the existing `@layer base` block with itself + add the new code after it).

- [ ] **Step 6: Visual check**

```bash
cd /Users/belan/PROJECTS/Hexlet_llm && make dev-frontend
```

Open `http://localhost:5173` — verify:
- Background is warm cream (not pure white)
- CTA button on Home is teal (not black)
- Text is warm dark (not pure black)
- Focus rings are teal

- [ ] **Step 7: Run quality checks**

```bash
cd /Users/belan/PROJECTS/Hexlet_llm && make typecheck && make lint-dev
```

Expected: no new errors

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app.css
git commit -m "style(frontend): brand color palette + Playfair Display font"
```

---

## Phase 2: Mobile Navigation — Bottom Tab Bar

### Task 2.1: Add i18n keys for bottom nav

**Files:**
- Modify: `frontend/src/lib/i18n/index.ts`

- [ ] **Step 1: Add time-of-day section labels to `booking` and tab labels**

In `frontend/src/lib/i18n/index.ts`, add to the `booking` object, after `slotTaken`:

```typescript
morning: 'Утро',
afternoon: 'День',
evening: 'Вечер',
```

These will be used in Phase 4 (slot grouping), but adding them now keeps i18n changes together.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/i18n/index.ts
git commit -m "feat(i18n): add time-of-day slot labels"
```

### Task 2.2: Replace hamburger with bottom tab bar

**Files:**
- Modify: `frontend/src/lib/components/Layout.svelte`

- [ ] **Step 1: Rewrite Layout.svelte**

Replace the entire contents of `frontend/src/lib/components/Layout.svelte` with:

```svelte
<script lang="ts">
  import HomeIcon from '@lucide/svelte/icons/house';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import ListIcon from '@lucide/svelte/icons/list';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { t } from '$lib/i18n/index.js';
  import { goto } from '@mateothegreat/svelte5-router';
  import { cn } from '$lib/utils.js';

  const { children } = $props();

  let currentPath = $state(window.location.pathname);

  $effect(() => {
    const orig = history.pushState.bind(history);
    history.pushState = (...args) => {
      orig(...args);
      currentPath = window.location.pathname;
    };
    const onPopState = () => { currentPath = window.location.pathname; };
    window.addEventListener('popstate', onPopState);
    return () => {
      history.pushState = orig;
      window.removeEventListener('popstate', onPopState);
    };
  });

  const navigate = ({ path }: { path: string }) => {
    goto(path);
    currentPath = path;
  };

  const navLinks = [
    { path: '/', label: t.nav.home, icon: HomeIcon },
    { path: '/booking', label: t.nav.booking, icon: CalendarIcon },
  ];

  const adminLinks = [
    { path: '/admin', label: t.nav.adminBookings, icon: ListIcon },
    { path: '/admin/event-types', label: t.nav.adminEventTypes, icon: SettingsIcon },
  ];

  const allLinks = [...navLinks, ...adminLinks];

  const isActive = ({ path }: { path: string }) => {
    if (currentPath === path) return true;
    if (path === '/booking') return currentPath.startsWith('/booking/');
    return false;
  };
</script>

{#snippet sidebarContent()}
  <div class="flex h-full flex-col">
    <div class="flex h-14 items-center px-4">
      <span class="font-display text-lg font-semibold text-primary">{t.nav.brand}</span>
    </div>
    <nav class="mt-2 flex flex-col gap-1 px-2">
      <p class="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t.nav.sectionGuest}
      </p>
      {#each navLinks as link (link.path)}
        <button
          type="button"
          class={cn(
            'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors hover:bg-accent/20',
            isActive({ path: link.path }) && 'bg-primary/10 font-medium text-primary',
          )}
          onclick={() => navigate({ path: link.path })}
        >
          <link.icon class="h-4 w-4 shrink-0" />
          {link.label}
        </button>
      {/each}

      <Separator class="my-2" />

      <p class="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t.nav.sectionOwner}
      </p>
      {#each adminLinks as link (link.path)}
        <button
          type="button"
          class={cn(
            'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors hover:bg-accent/20',
            isActive({ path: link.path }) && 'bg-primary/10 font-medium text-primary',
          )}
          onclick={() => navigate({ path: link.path })}
        >
          <link.icon class="h-4 w-4 shrink-0" />
          {link.label}
        </button>
      {/each}
    </nav>
  </div>
{/snippet}

<!-- Desktop sidebar — visible on lg+ -->
<aside class="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background">
  {@render sidebarContent()}
</aside>

<!-- Main layout -->
<div class="flex min-h-screen flex-col lg:ml-64">
  <!-- Desktop header -->
  <header class="sticky top-0 z-40 hidden h-14 items-center border-b bg-background/80 px-4 backdrop-blur-sm lg:flex">
    <span class="font-display text-lg font-semibold text-primary">{t.nav.brand}</span>
  </header>

  <!-- Main content — extra bottom padding on mobile for tab bar -->
  <main class="flex-1 pb-20 lg:pb-0">
    {@render children()}
  </main>

  <!-- Mobile bottom tab bar — visible below lg -->
  <nav class="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-sm lg:hidden">
    <div class="flex h-16 items-stretch">
      {#each allLinks as link (link.path)}
        <button
          type="button"
          class={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors',
            isActive({ path: link.path })
              ? 'text-primary font-semibold'
              : 'text-muted-foreground',
          )}
          onclick={() => navigate({ path: link.path })}
        >
          <link.icon class={cn(
            'h-5 w-5 transition-transform',
            isActive({ path: link.path }) && 'scale-110',
          )} />
          <span class="truncate">{link.label}</span>
        </button>
      {/each}
    </div>
    <!-- Safe area for phones with home indicator -->
    <div class="h-[env(safe-area-inset-bottom)]"></div>
  </nav>
</div>
```

Key changes:
- Removed `Sheet` (hamburger drawer) entirely
- Removed `MenuIcon` import
- Added bottom tab bar with 4 items, fixed at bottom, hidden on `lg+`
- Desktop sidebar stays with brand color updates
- Desktop header hidden on mobile (no hamburger needed)
- Main content gets `pb-20 lg:pb-0` to not overlap tab bar
- Active tab: brand teal color + `scale-110` icon
- `font-display` on brand text for Playfair Display
- `backdrop-blur-sm` for glass effect on header/tab bar
- Safe area inset for iPhone notch

- [ ] **Step 2: Visual check on mobile (375x812)**

Open `http://localhost:5173` — verify:
- Bottom tab bar with 4 icons visible
- No hamburger menu
- Active tab is teal
- Content doesn't hide behind tab bar
- Navigate all 4 tabs — each highlights correctly
- On desktop (resize to 1280px) — sidebar visible, no tab bar

- [ ] **Step 3: Run quality checks**

```bash
cd /Users/belan/PROJECTS/Hexlet_llm && make typecheck && make lint-dev
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/components/Layout.svelte
git commit -m "feat(frontend): replace hamburger with bottom tab bar on mobile"
```

---

## Phase 3: Slot UX — Disabled Styling + Time Grouping

### Task 3.1: Fix disabled slot visibility

**Files:**
- Modify: `frontend/src/lib/components/SlotPicker.svelte`

- [ ] **Step 1: Update the slot button rendering**

In `frontend/src/lib/components/SlotPicker.svelte`, replace the slot grid section (the `{:else}` branch with `grid-cols-3`):

Find:
```svelte
    <div class="grid grid-cols-3 gap-2">
      {#each query.data.data as slot (slot.startTime)}
        <Button
          variant={selectedSlot === slot.startTime ? 'default' : 'outline'}
          disabled={!slot.available}
          class="h-10"
          onclick={() => slot.available && selectSlot({ startTime: slot.startTime })}
        >
          {formatTime({ isoStr: slot.startTime })}
        </Button>
      {/each}
    </div>
```

Replace with:
```svelte
    <div class="grid grid-cols-3 gap-2">
      {#each query.data.data as slot (slot.startTime)}
        <Button
          variant={selectedSlot === slot.startTime ? 'default' : 'outline'}
          disabled={!slot.available}
          class={cn(
            'h-10',
            !slot.available && 'line-through opacity-40 bg-muted/50 border-muted',
          )}
          onclick={() => slot.available && selectSlot({ startTime: slot.startTime })}
        >
          {formatTime({ isoStr: slot.startTime })}
        </Button>
      {/each}
    </div>
```

Also add `cn` import at top of `<script>` — add after existing imports:

```typescript
import { cn } from '$lib/utils.js';
```

- [ ] **Step 2: Visual check**

Navigate to Interview → April 29 → verify 16:30 slot:
- Has strikethrough text
- Has muted background
- Clearly different from available slots

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/components/SlotPicker.svelte
git commit -m "fix(frontend): make disabled time slots clearly distinguishable"
```

### Task 3.2: Group slots by time of day

**Files:**
- Modify: `frontend/src/lib/components/SlotPicker.svelte`
- Modify: `frontend/src/lib/i18n/index.ts` (already done in 2.1)

- [ ] **Step 1: Add grouping helper and icons**

In `frontend/src/lib/components/SlotPicker.svelte`, add imports after existing ones:

```typescript
import SunriseIcon from '@lucide/svelte/icons/sunrise';
import SunIcon from '@lucide/svelte/icons/sun';
import SunsetIcon from '@lucide/svelte/icons/sunset';
```

Add a grouping helper after the `selectSlot` function:

```typescript
const groupSlotsByTimeOfDay = ({ slots }: { slots: typeof query.data.data }) => {
  const morning = slots.filter((s) => new Date(s.startTime).getHours() < 12);
  const afternoon = slots.filter((s) => {
    const h = new Date(s.startTime).getHours();
    return h >= 12 && h < 17;
  });
  const evening = slots.filter((s) => new Date(s.startTime).getHours() >= 17);
  return [
    { label: t.booking.morning, icon: SunriseIcon, slots: morning },
    { label: t.booking.afternoon, icon: SunIcon, slots: afternoon },
    { label: t.booking.evening, icon: SunsetIcon, slots: evening },
  ].filter((g) => g.slots.length > 0);
};
```

Also import `t`:

```typescript
import { t } from '$lib/i18n/index.js';
```

(Check if `t` is already imported — it is. No duplicate needed.)

- [ ] **Step 2: Replace flat slot grid with grouped rendering**

Replace the entire slot section (from `<p class="mb-2 ...">Выберите время</p>` through end of the `{#if}` block) with:

```svelte
  <p class="mb-2 text-sm font-medium text-muted-foreground">{t.booking.selectSlot}</p>

  {#if query.isPending}
    <div class="grid grid-cols-3 gap-2">
      {#each [1, 2, 3, 4, 5, 6] as i (i)}
        <div class="h-10 animate-pulse rounded-md bg-muted"></div>
      {/each}
    </div>
  {:else if query.isError}
    <p class="text-sm text-destructive">{t.common.error}</p>
  {:else if query.data?.status !== 200 || query.data.data.length === 0}
    <p class="text-sm text-muted-foreground">{t.booking.slotsEmpty}</p>
  {:else}
    {@const groups = groupSlotsByTimeOfDay({ slots: query.data.data })}
    <div class="flex flex-col gap-4">
      {#each groups as group (group.label)}
        <div>
          <div class="mb-2 flex items-center gap-1.5">
            <group.icon class="h-3.5 w-3.5 text-muted-foreground" />
            <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{group.label}</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            {#each group.slots as slot (slot.startTime)}
              <Button
                variant={selectedSlot === slot.startTime ? 'default' : 'outline'}
                disabled={!slot.available}
                class={cn(
                  'h-10',
                  !slot.available && 'line-through opacity-40 bg-muted/50 border-muted',
                )}
                onclick={() => slot.available && selectSlot({ startTime: slot.startTime })}
              >
                {formatTime({ isoStr: slot.startTime })}
              </Button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
```

- [ ] **Step 3: Visual check**

Navigate to booking page → verify:
- Slots grouped under "Утро" / "День" / "Вечер" headers
- Each group has its icon (sunrise/sun/sunset)
- Empty groups are hidden
- Disabled slots still have strikethrough

- [ ] **Step 4: Run quality checks**

```bash
cd /Users/belan/PROJECTS/Hexlet_llm && make typecheck && make lint-dev
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/components/SlotPicker.svelte
git commit -m "feat(frontend): group time slots by morning/afternoon/evening"
```

---

## Phase 4: Compact Cards + Typography

### Task 4.1: Add `font-display` utility class for headings

**Files:**
- Modify: `frontend/src/pages/Home.svelte`
- Modify: `frontend/src/pages/EventTypes.svelte`
- Modify: `frontend/src/pages/Booking.svelte`
- Modify: `frontend/src/pages/AdminBookings.svelte`
- Modify: `frontend/src/pages/AdminEventTypes.svelte`
- Modify: `frontend/src/pages/NotFound.svelte`

- [ ] **Step 1: Apply `font-display` to all page h1 headings**

In each page file, find the `<h1>` tag and add `font-display` class:

**Home.svelte** — find:
```svelte
<h1 class="text-2xl font-bold">{t.home.title}</h1>
```
Replace with:
```svelte
<h1 class="font-display text-2xl font-bold">{t.home.title}</h1>
```

**EventTypes.svelte** — find:
```svelte
<h1 class="mb-6 text-2xl font-bold">{t.eventTypes.title}</h1>
```
Replace with:
```svelte
<h1 class="mb-6 font-display text-2xl font-bold">{t.eventTypes.title}</h1>
```

**Booking.svelte** — find:
```svelte
<h1 class="text-xl font-bold">{displayEventType.name}</h1>
```
Replace with:
```svelte
<h1 class="font-display text-xl font-bold">{displayEventType.name}</h1>
```

**AdminBookings.svelte** — find:
```svelte
<h1 class="mb-6 text-2xl font-bold">{t.admin.bookings.title}</h1>
```
Replace with:
```svelte
<h1 class="mb-6 font-display text-2xl font-bold">{t.admin.bookings.title}</h1>
```

**AdminEventTypes.svelte** — find:
```svelte
<h1 class="text-2xl font-bold">{t.admin.eventTypes.title}</h1>
```
Replace with:
```svelte
<h1 class="font-display text-2xl font-bold">{t.admin.eventTypes.title}</h1>
```

**NotFound.svelte** — find:
```svelte
<h1 class="text-2xl font-bold">{t.notFound.title}</h1>
```
Replace with:
```svelte
<h1 class="font-display text-2xl font-bold">{t.notFound.title}</h1>
```

- [ ] **Step 2: Also apply to MyBookings h2**

In `frontend/src/lib/components/MyBookings.svelte`, find:
```svelte
<h2 class="mb-4 text-xl font-bold">{t.myBookings.title}</h2>
```
Replace with:
```svelte
<h2 class="mb-4 font-display text-xl font-bold">{t.myBookings.title}</h2>
```

- [ ] **Step 3: Visual check**

Verify all headings now show Playfair Display (serif) while body text stays Geist (sans-serif).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/ frontend/src/lib/components/MyBookings.svelte
git commit -m "style(frontend): apply display font to all page headings"
```

### Task 4.2: Compact event type cards

**Files:**
- Modify: `frontend/src/lib/components/EventTypeCardContent.svelte`
- Modify: `frontend/src/pages/EventTypes.svelte`
- Modify: `frontend/src/pages/AdminEventTypes.svelte`

- [ ] **Step 1: Make EventTypeCardContent more compact**

In `frontend/src/lib/components/EventTypeCardContent.svelte`, replace the template (everything after `</script>`):

```svelte
<div class="flex items-center gap-3 border-l-4 pl-3 {colors.border}">
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-semibold leading-snug">{name}</p>
    <span class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {colors.badge}">
      <ClockIcon class="h-3 w-3" />
      {duration} мин
    </span>
  </div>

  {#if actions}
    <div class="shrink-0">
      {@render actions()}
    </div>
  {/if}
</div>
```

Changes: removed CalendarIcon, reduced gap, reduced text size, removed `self-start` from actions, tighter margins.

- [ ] **Step 2: Reduce card padding in EventTypes.svelte**

In `frontend/src/pages/EventTypes.svelte`, find:
```svelte
<Card.Content class="p-4">
```
Replace with:
```svelte
<Card.Content class="px-4 py-3">
```

- [ ] **Step 3: Reduce card padding in AdminEventTypes.svelte**

In `frontend/src/pages/AdminEventTypes.svelte`, find both `<Card.Content class="p-4">` instances. Replace each with:
```svelte
<Card.Content class="px-4 py-3">
```

- [ ] **Step 4: Visual check on mobile**

All 3 event type cards should now fit on screen without scrolling at 375x812.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/components/EventTypeCardContent.svelte frontend/src/pages/EventTypes.svelte frontend/src/pages/AdminEventTypes.svelte
git commit -m "style(frontend): compact event type cards for better mobile fit"
```

### Task 4.3: Compact booking cards

**Files:**
- Modify: `frontend/src/lib/components/BookingCardContent.svelte`

- [ ] **Step 1: Tighten BookingCardContent layout**

In `frontend/src/lib/components/BookingCardContent.svelte`, replace the template (everything after `</script>`):

```svelte
<div class="flex items-start gap-3 border-l-4 py-1 pl-3 {colors.border}">
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-semibold leading-snug">{eventTypeName}</p>

    <div class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
      <span class="flex items-center gap-1 text-xs text-muted-foreground">
        <CalendarIcon class="h-3 w-3 shrink-0" />
        {formatDate({ isoStr: startTime })}
      </span>
      <span class="flex items-center gap-1 text-xs text-muted-foreground">
        <ClockIcon class="h-3 w-3 shrink-0" />
        {formatTime({ isoStr: startTime })}
      </span>
    </div>

    {#if guestName || guestEmail}
      <div class="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {#if guestName}
          <span class="flex items-center gap-1 text-xs text-muted-foreground">
            <UserIcon class="h-3 w-3 shrink-0" />
            {guestName}
          </span>
        {/if}
        {#if guestEmail}
          <span class="flex items-center gap-1 text-xs text-muted-foreground">
            <MailIcon class="h-3 w-3 shrink-0" />
            {guestEmail}
          </span>
        {/if}
      </div>
    {/if}

    <span class="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {colors.badge}">
      <ClockIcon class="h-3 w-3" />
      {duration} мин
    </span>
  </div>

  {#if actions}
    <div class="shrink-0 self-start">
      {@render actions()}
    </div>
  {/if}
</div>
```

Changes: smaller text (`text-sm`/`text-xs`), tighter gaps, less vertical margin.

- [ ] **Step 2: Visual check**

Check Home (My Bookings section) and Admin Bookings — cards should be more compact.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/components/BookingCardContent.svelte
git commit -m "style(frontend): compact booking cards for better density"
```

---

## Phase 5: Home Page + Animations

### Task 5.1: Redesign Home page

**Files:**
- Modify: `frontend/src/pages/Home.svelte`

- [ ] **Step 1: Rewrite Home.svelte**

Replace entire contents of `frontend/src/pages/Home.svelte`:

```svelte
<script lang="ts">
  import { goto } from '@mateothegreat/svelte5-router';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import { Button } from '$lib/components/ui/button/index.js';
  import MyBookings from '$lib/components/MyBookings.svelte';
  import { t } from '$lib/i18n/index.js';
</script>

<div class="mx-auto max-w-lg p-6">
  <!-- Hero -->
  <div class="mb-8 flex flex-col items-center text-center">
    <div
      class="animate-fade-in-up mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"
    >
      <CalendarIcon class="h-10 w-10" />
    </div>
    <h1
      class="animate-fade-in-up font-display text-2xl font-bold"
      style="animation-delay: 80ms"
    >
      {t.home.title}
    </h1>
    <p
      class="animate-fade-in-up mt-2 text-muted-foreground"
      style="animation-delay: 160ms"
    >
      {t.home.subtitle}
    </p>
    <Button
      class="animate-fade-in-up mt-6 w-full max-w-xs"
      style="animation-delay: 240ms"
      onclick={() => goto('/booking')}
    >
      {t.home.cta}
    </Button>
  </div>

  <!-- My bookings -->
  <div class="animate-fade-in-up" style="animation-delay: 320ms">
    <MyBookings />
  </div>
</div>
```

Changes:
- Icon container: `rounded-2xl bg-primary/10 text-primary` instead of filled black circle
- Stagger animation: each element fades in with 80ms delay
- `font-display` on heading
- Removed black circle background — icon is now teal on light teal bg

- [ ] **Step 2: Visual check**

Reload Home page — verify:
- Stagger animation plays (icon → title → subtitle → CTA → bookings)
- Icon is teal on light teal rounded square
- CTA button is teal
- Typography mix: Playfair heading + Geist body

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Home.svelte
git commit -m "style(frontend): redesign home page with brand colors and stagger animation"
```

### Task 5.2: Add stagger animations to card lists

**Files:**
- Modify: `frontend/src/pages/EventTypes.svelte`
- Modify: `frontend/src/pages/AdminBookings.svelte`
- Modify: `frontend/src/pages/AdminEventTypes.svelte`

- [ ] **Step 1: Add stagger to EventTypes.svelte card list**

In `frontend/src/pages/EventTypes.svelte`, find the `{#each}` loop inside the card list. Wrap each card `<button>` with a stagger delay. Replace:

```svelte
{#each query.data.data as eventType (eventType.id)}
  <button
    type="button"
    class="w-full text-left"
    onclick={() => navigate({ eventType })}
  >
```

With (using index):

```svelte
{#each query.data.data as eventType, i (eventType.id)}
  <button
    type="button"
    class="animate-fade-in-up w-full text-left"
    style="animation-delay: {i * 60}ms"
    onclick={() => navigate({ eventType })}
  >
```

- [ ] **Step 2: Add stagger to AdminBookings.svelte**

In `frontend/src/pages/AdminBookings.svelte`, find the `{#each}` loop. Replace:

```svelte
{#each query.data.data as booking (booking.id)}
  <Card.Root>
```

With:

```svelte
{#each query.data.data as booking, i (booking.id)}
  <Card.Root class="animate-fade-in-up" style="animation-delay: {i * 60}ms">
```

- [ ] **Step 3: Add stagger to AdminEventTypes.svelte**

In `frontend/src/pages/AdminEventTypes.svelte`, find the `{#each}` loop. Replace:

```svelte
{#each query.data.data as et (et.id)}
  <Card.Root>
```

With:

```svelte
{#each query.data.data as et, i (et.id)}
  <Card.Root class="animate-fade-in-up" style="animation-delay: {i * 60}ms">
```

- [ ] **Step 4: Visual check**

Navigate between pages — cards should fade in with stagger effect.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/EventTypes.svelte frontend/src/pages/AdminBookings.svelte frontend/src/pages/AdminEventTypes.svelte
git commit -m "style(frontend): add stagger fade-in animation to card lists"
```

### Task 5.3: Success animation on booking form

**Files:**
- Modify: `frontend/src/lib/components/BookingForm.svelte`

- [ ] **Step 1: Enhance success state with checkmark animation**

In `frontend/src/lib/components/BookingForm.svelte`, find the success block:

```svelte
{#if success}
  <div class="rounded-md bg-green-50 p-4 text-center text-green-700">
    {t.booking.success}
  </div>
```

Replace with:

```svelte
{#if success}
  <div class="flex flex-col items-center gap-3 rounded-xl bg-primary/10 p-6 text-center">
    <div class="animate-scale-check flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <p class="animate-fade-in-up text-sm font-medium text-primary" style="animation-delay: 200ms">
      {t.booking.success}
    </p>
  </div>
```

- [ ] **Step 2: Visual check**

Complete a booking — verify:
- Checkmark icon scales in with bounce
- Success text fades in after checkmark
- Colors are brand teal (not hardcoded green)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/components/BookingForm.svelte
git commit -m "style(frontend): animated success state for booking form"
```

---

## Phase 6: Polish

### Task 6.1: Card hover/active micro-interactions

**Files:**
- Modify: `frontend/src/pages/EventTypes.svelte`

- [ ] **Step 1: Add hover shadow + active scale to event type cards**

In `frontend/src/pages/EventTypes.svelte`, find:

```svelte
<Card.Root class="cursor-pointer transition-colors hover:bg-accent/50">
```

Replace with:

```svelte
<Card.Root class="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/EventTypes.svelte
git commit -m "style(frontend): add hover shadow and active scale to event type cards"
```

### Task 6.2: Final quality gate

- [ ] **Step 1: Run full quality checks**

```bash
cd /Users/belan/PROJECTS/Hexlet_llm && make check
```

Expected: all checks pass (lint, typecheck, tests)

- [ ] **Step 2: Visual review all pages on mobile (375x812)**

Check each page:
- [ ] Home — brand colors, stagger, serif heading
- [ ] EventTypes — compact cards, hover effect, stagger
- [ ] Booking (SlotPicker) — grouped slots, disabled visible
- [ ] Booking Form (Sheet) — form works, success animation
- [ ] Admin Bookings — compact cards, stagger
- [ ] Admin Event Types — compact cards, CRUD works
- [ ] 404 — serif heading, brand colors
- [ ] Bottom tab bar — all 4 tabs work, active state correct

- [ ] **Step 3: Visual review on desktop (1280x800)**

- [ ] Sidebar + header visible, no tab bar
- [ ] Content centered, not too narrow
- [ ] Brand colors consistent

- [ ] **Step 4: Final commit if any fixes needed**

---

## Summary of Changes

| What | Before | After |
|------|--------|-------|
| Primary color | Gray `oklch(0.205 0 0)` | Teal `oklch(0.637 0.137 162)` |
| Accent color | Gray | Amber `oklch(0.72 0.15 55)` |
| Background | Pure white | Warm cream `oklch(0.985 0.005 80)` |
| Headings font | Geist (same as body) | Playfair Display (serif) |
| Mobile nav | Hamburger + Sheet drawer | Bottom tab bar (4 tabs) |
| Disabled slots | opacity 0.5 only | Strikethrough + muted bg |
| Slot layout | Flat grid of 16 buttons | Grouped by Morning/Afternoon/Evening |
| Card density | Large padding, fills screen | Compact, 3 cards visible |
| Animations | None (except modals) | Stagger fade-in, success checkmark |
| Home hero | Black circle icon | Teal icon on light teal bg |
| Card hover | bg-accent/50 | shadow-md + active scale |
