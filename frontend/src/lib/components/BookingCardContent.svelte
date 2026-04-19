<script lang="ts">
  import type { Snippet } from 'svelte';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import UserIcon from '@lucide/svelte/icons/user';
  import MailIcon from '@lucide/svelte/icons/mail';

  let {
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

  // Color palette keyed by duration bucket
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

<div class="flex items-start gap-4 border-l-4 py-1 pl-4 {colors.border}">
  <div class="min-w-0 flex-1">
    <!-- Title -->
    <p class="truncate text-base font-semibold leading-snug">{eventTypeName}</p>

    <!-- Date & time row -->
    <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarIcon class="h-3.5 w-3.5 shrink-0" />
        {formatDate({ isoStr: startTime })}
      </span>
      <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <ClockIcon class="h-3.5 w-3.5 shrink-0" />
        {formatTime({ isoStr: startTime })}
      </span>
    </div>

    <!-- Guest info (admin view) -->
    {#if guestName || guestEmail}
      <div class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        {#if guestName}
          <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserIcon class="h-3.5 w-3.5 shrink-0" />
            {guestName}
          </span>
        {/if}
        {#if guestEmail}
          <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MailIcon class="h-3.5 w-3.5 shrink-0" />
            {guestEmail}
          </span>
        {/if}
      </div>
    {/if}

    <!-- Duration badge -->
    <span class="mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium {colors.badge}">
      <ClockIcon class="h-3 w-3" />
      {duration} мин
    </span>
  </div>

  <!-- Action slot -->
  {#if actions}
    <div class="shrink-0 self-center">
      {@render actions()}
    </div>
  {/if}
</div>
