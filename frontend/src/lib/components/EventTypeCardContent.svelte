<script lang="ts">
  import type { Snippet } from 'svelte';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import CalendarIcon from '@lucide/svelte/icons/calendar';

  let {
    name,
    duration,
    actions,
  }: {
    name: string;
    duration: number;
    actions?: Snippet;
  } = $props();

  const colors = $derived(
    duration <= 15
      ? {
          border: 'border-l-sky-400',
          badge: 'bg-sky-50 text-sky-700 border border-sky-200',
        }
      : duration <= 20
      ? {
          border: 'border-l-emerald-400',
          badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        }
      : duration <= 30
      ? {
          border: 'border-l-amber-400',
          badge: 'bg-amber-50 text-amber-700 border border-amber-200',
        }
      : {
          border: 'border-l-violet-400',
          badge: 'bg-violet-50 text-violet-700 border border-violet-200',
        },
  );
</script>

<div class="flex items-center gap-4 border-l-4 py-1 pl-4 {colors.border}">
  <div class="min-w-0 flex-1">
    <!-- Title -->
    <div class="flex items-center gap-2">
      <CalendarIcon class="h-4 w-4 shrink-0 text-muted-foreground" />
      <p class="truncate text-base font-semibold leading-snug">{name}</p>
    </div>

    <!-- Duration badge -->
    <span class="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium {colors.badge}">
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
