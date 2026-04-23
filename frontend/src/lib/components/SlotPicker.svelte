<script lang="ts">
  import { createSlotsList } from '$lib/api/default/default.js';
  import type { Slot } from '$lib/api/model/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Calendar } from '$lib/components/ui/calendar/index.js';
  import { t } from '$lib/i18n/index.js';
  import { cn, formatTime } from '$lib/utils.js';
  import SunriseIcon from '@lucide/svelte/icons/sunrise';
  import SunIcon from '@lucide/svelte/icons/sun';
  import SunsetIcon from '@lucide/svelte/icons/sunset';
  import { today, getLocalTimeZone, type DateValue } from '@internationalized/date';
  import { tick } from 'svelte';

  const { eventTypeId, onSlotSelect }: {
    eventTypeId: string;
    onSlotSelect: (startTime: string) => void;
  } = $props();

  const tz = getLocalTimeZone();
  const selectableMin = today(tz);
  const selectableMax = today(tz).add({ days: 13 });
  const displayMin = selectableMin;
  const displayMax = selectableMax;
  const minValue = today(tz).subtract({ days: 31 });
  const maxValue = today(tz).add({ days: 61 });
  const spansMonths = selectableMin.month !== selectableMax.month;
  const numberOfMonths = spansMonths ? 2 : 1;

  const isDateDisabled = (date: DateValue) =>
    date.compare(selectableMin) < 0 || date.compare(selectableMax) > 0;

  const displayMinStr = displayMin.toString();
  const displayMaxStr = displayMax.toString();

  let calendarValue = $state<DateValue | undefined>(selectableMin);
  let selectedSlot = $state<string | null>(null);

  const selectedDate = $derived(calendarValue ? calendarValue.toString() : minValue.toString());

  $effect(() => {
    // Reset slot when date changes
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    selectedDate;
    selectedSlot = null;
  });

  const query = $derived(
    createSlotsList(() => ({ date: selectedDate, eventTypeId })),
  );

  const selectSlot = ({ startTime }: { startTime: string }) => {
    selectedSlot = startTime;
    onSlotSelect(startTime);
  };

  const groupSlotsByTimeOfDay = ({ slots }: { slots: Slot[] }) => {
    const morning = slots.filter((s: Slot) => new Date(s.startTime).getHours() < 12);
    const afternoon = slots.filter((s: Slot) => {
      const h = new Date(s.startTime).getHours();
      return h >= 12 && h < 17;
    });
    const evening = slots.filter((s: Slot) => new Date(s.startTime).getHours() >= 17);
    return [
      { label: t.booking.morning, icon: SunriseIcon, slots: morning },
      { label: t.booking.afternoon, icon: SunIcon, slots: afternoon },
      { label: t.booking.evening, icon: SunsetIcon, slots: evening },
    ].filter((g) => g.slots.length > 0);
  };

  const hideOutOfRangeRows = async () => {
    await tick();
    const rows = document.querySelectorAll('.hide-disabled-weeks tbody tr');
    rows.forEach((tr) => {
      const days = tr.querySelectorAll('[data-bits-day]');
      if (days.length === 0) return;
      const hasVisibleDay = Array.from(days).some((d) => {
        const v = d.getAttribute('data-value') ?? '';
        return v >= displayMinStr && v <= displayMaxStr;
      });
      (tr as HTMLElement).style.display = hasVisibleDay ? '' : 'none';
    });
  };

  $effect(() => {
    // Re-run when calendar value changes (triggers DOM update)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    calendarValue;
    hideOutOfRangeRows();
  });
</script>

<style>
  /* Hide prev/next navigation — range is fixed */
  :global(.hide-disabled-weeks nav) {
    display: none;
  }
  /* Hide days belonging to another month — each month shows only its own dates */
  :global(.hide-disabled-weeks [data-outside-month]) {
    visibility: hidden;
  }
  /* Stack months vertically even on desktop */
  :global(.hide-disabled-weeks > div) {
    flex-direction: column;
  }
  /* Show weekday header (пн вт …) only for the first month */
  :global(.hide-disabled-weeks > div > div + div thead) {
    display: none;
  }
  /* Add spacing above second month header to separate from previous month's dates.
     Match gap to first month: "Апрель 2026" → weekday row ≈ 5px,
     so "Май 2026" → first date row should also be ≈ 5px.
     Hidden thead leaves native gap; use negative margin to close it. */
  :global(.hide-disabled-weeks > div > div + div header) {
    margin-top: 0.75rem;
    margin-bottom: -0.75rem;
  }
  /* Reduce month header height — nav is hidden, no need for extra space */
  :global(.hide-disabled-weeks header) {
    height: auto;
  }
  /* Tint weekend columns (Sat=6th, Sun=7th) */
  :global(.hide-disabled-weeks td:nth-child(6) [data-bits-day]:not([data-selected]):not([data-disabled])),
  :global(.hide-disabled-weeks td:nth-child(7) [data-bits-day]:not([data-selected]):not([data-disabled])) {
    color: var(--color-destructive);
  }
  :global(.hide-disabled-weeks th:nth-child(6)),
  :global(.hide-disabled-weeks th:nth-child(7)) {
    color: var(--color-destructive);
  }
</style>

<div>
  <p class="mb-2 text-sm font-medium text-muted-foreground">{t.booking.selectDate}</p>

  <!-- Month calendar — only next 14 days are selectable -->
  <div class="mb-4 flex justify-center">
    <Calendar
      type="single"
      bind:value={calendarValue}
      {numberOfMonths}
      {minValue}
      {maxValue}
      {isDateDisabled}
      locale="ru"
      class="hide-disabled-weeks w-full rounded-lg border"
    />
  </div>

  <!-- Slot grid -->
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
    {@const groups = groupSlotsByTimeOfDay({ slots: query.data.data as Slot[] })}
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
                  !slot.available && 'border-muted bg-muted/50 line-through opacity-40',
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
</div>
