<script lang="ts">
  import MenuIcon from '@lucide/svelte/icons/menu';
  import HomeIcon from '@lucide/svelte/icons/house';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import ListIcon from '@lucide/svelte/icons/list';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { t } from '$lib/i18n/index.js';
  import { goto } from '@mateothegreat/svelte5-router';
  import { cn } from '$lib/utils.js';

  let { children } = $props();

  let open = $state(false);
  let currentPath = $state(window.location.pathname);

  $effect(() => {
    const onPopState = () => { currentPath = window.location.pathname; };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  });

  const navigate = ({ path }: { path: string }) => {
    open = false;
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

  const isActive = ({ path }: { path: string }) => {
    if (currentPath === path) return true;
    if (path === '/booking') return currentPath.startsWith('/booking/');
    return false;
  };
</script>

{#snippet navContent()}
  <div class="flex h-full flex-col">
    <div class="px-4 py-3">
      <span class="text-lg font-semibold">{t.nav.brand}</span>
    </div>
    <nav class="flex flex-col gap-1 px-2">
      {#each navLinks as link (link.path)}
        <button
          type="button"
          class={cn(
            'flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors hover:bg-accent',
            isActive({ path: link.path }) && 'bg-accent font-medium',
          )}
          onclick={() => navigate({ path: link.path })}
        >
          <link.icon class="h-4 w-4 shrink-0" />
          {link.label}
        </button>
      {/each}

      <Separator class="my-2" />

      {#each adminLinks as link (link.path)}
        <button
          type="button"
          class={cn(
            'flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors hover:bg-accent',
            isActive({ path: link.path }) && 'bg-accent font-medium',
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

<!-- Fixed sidebar — visible on lg+ -->
<aside class="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background">
  {@render navContent()}
</aside>

<!-- Mobile sheet drawer -->
<Sheet.Root bind:open>
  <Sheet.Content side="left" class="w-64 p-0">
    {@render navContent()}
  </Sheet.Content>

  <!-- Main layout -->
  <div class="flex min-h-screen flex-col lg:ml-64">
    <header class="sticky top-0 z-40 flex h-12 items-center border-b bg-background px-4">
      <!-- Hamburger: hidden when sidebar is fixed -->
      <Sheet.Trigger
        class="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent lg:hidden"
        aria-label="Открыть меню"
      >
        <MenuIcon class="h-5 w-5" />
      </Sheet.Trigger>
      <span class="ml-3 text-lg font-semibold lg:ml-0">{t.nav.brand}</span>
    </header>

    <main class="flex-1">
      {@render children()}
    </main>
  </div>
</Sheet.Root>
