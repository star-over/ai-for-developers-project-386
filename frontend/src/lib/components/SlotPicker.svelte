<script lang="ts">
  import { createSlotsList } from '$lib/api/default/default.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Calendar } from '$lib/components/ui/calendar/index.js';
  import { t } from '$lib/i18n/index.js';
  import { today, getLocalTimeZone, type DateValue } from '@internationalized/date';
  import { tick } from 'svelte';

  let { eventTypeId, onSlotSelect }: {
    eventTypeId: string;
    onSlotSelect: (startTime: string) => void;
  } = $props();

  const tz = getLocalTimeZone();
  const selectableMin = today(tz);
  const selectableMax = today(tz).add({ days: 13 });
  const displayMin = today(tz).subtract({ days: 7 });
  const displayMax = today(tz).add({ days: 20 });
  const minValue = displayMin;
  const maxValue = displayMax;
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

  const formatTime = ({ isoStr }: { isoStr: string }) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  };

  const selectSlot = ({ startTime }: { startTime: string }) => {
    selectedSlot = startTime;
    onSlotSelect(startTime);
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
    <p class="text-sm text-muted-foreground">Нет доступных слотов</p>
  {:else}
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
  {/if}
</div>
