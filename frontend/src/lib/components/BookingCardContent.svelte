<script lang="ts">
  import type { Snippet } from 'svelte';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import UserIcon from '@lucide/svelte/icons/user';
  import MailIcon from '@lucide/svelte/icons/mail';
  import { getDurationColors } from '$lib/utils.js';

  const {
    eventTypeName,
    startTime,
    duration,
    guestName,
    guestEmail,
    actions,
  }: {
    eventTypeName: string;
    startTime: string;
    duration: number;
    guestName?: string;
    guestEmail?: string;
    actions?: Snippet;
  } = $props();

  const formatDate = ({ isoStr }: { isoStr: string }) =>
    new Date(isoStr).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatTime = ({ isoStr }: { isoStr: string }) =>
    new Date(isoStr).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

  const colors = $derived(getDurationColors({ duration }));
</script>

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
