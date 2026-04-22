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
              ? 'font-semibold text-primary'
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
