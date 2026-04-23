<script lang="ts">
  import type { Snippet } from 'svelte';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import { getDurationColors } from '$lib/utils.js';
  import { t } from '$lib/i18n/index.js';

  const {
    name,
    duration,
    actions,
  }: {
    name: string;
    duration: number;
    actions?: Snippet;
  } = $props();

  const colors = $derived(getDurationColors({ duration }));
</script>

<div class="flex items-center gap-3 border-l-4 pl-3 {colors.border}">
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-semibold leading-snug">{name}</p>
    <span class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {colors.badge}">
      <ClockIcon class="h-3 w-3" />
      {duration} {t.eventTypes.minutes}
    </span>
  </div>

  {#if actions}
    <div class="shrink-0">
      {@render actions()}
    </div>
  {/if}
</div>
