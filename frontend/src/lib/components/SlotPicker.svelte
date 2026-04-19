<script lang="ts">
  import { createSlotsList } from '$lib/api/default/default.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Calendar } from '$lib/components/ui/calendar/index.js';
  import { t } from '$lib/i18n/index.js';
  import { today, getLocalTimeZone, type DateValue } from '@internationalized/date';

  let { eventTypeId, onSlotSelect }: {
    eventTypeId: string;
    onSlotSelect: (startTime: string) => void;
  } = $props();

  const tz = getLocalTimeZone();
  const minValue = today(tz);
  const maxValue = today(tz).add({ days: 13 });

  let calendarValue = $state<DateValue | undefined>(minValue);
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
</script>

<div>
  <p class="mb-2 text-sm font-medium text-muted-foreground">{t.booking.selectDate}</p>

  <!-- Month calendar — only next 14 days are selectable -->
  <div class="mb-4 flex justify-center">
    <Calendar
      type="single"
      bind:value={calendarValue}
      {minValue}
      {maxValue}
      locale="ru"
      class="rounded-lg border"
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
