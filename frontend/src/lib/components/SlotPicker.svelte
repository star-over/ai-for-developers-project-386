<script lang="ts">
  import { createSlotsList } from '$lib/api/default/default.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { t } from '$lib/i18n/index.js';
  import { cn } from '$lib/utils.js';

  let { eventTypeId, onSlotSelect }: {
    eventTypeId: string;
    onSlotSelect: (startTime: string) => void;
  } = $props();

  const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const today = new Date();
  const todayMs = today.getTime();
  const MS_PER_DAY = 86400000;
  const dates = Array.from({ length: 14 }, (_, i) => new Date(todayMs + i * MS_PER_DAY));

  const formatDate = ({ date }: { date: Date }) =>
    date.toISOString().slice(0, 10);

  let selectedDate = $state(formatDate({ date: new Date() }));
  let selectedSlot = $state<string | null>(null);

  const query = $derived(
    createSlotsList({ date: selectedDate, eventTypeId }),
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

  <!-- Date strip -->
  <div class="mb-4 flex gap-2 overflow-x-auto pb-2">
    {#each dates as date (formatDate({ date }))}
      {@const dateStr = formatDate({ date })}
      <button
        type="button"
        class={cn(
          'flex min-h-[56px] min-w-[52px] flex-col items-center justify-center rounded-md border px-2 py-1 text-xs transition-colors',
          selectedDate === dateStr
            ? 'border-primary bg-primary text-primary-foreground'
            : 'hover:bg-accent',
        )}
        onclick={() => { selectedDate = dateStr; selectedSlot = null; }}
      >
        <span class="text-[10px]">{DAY_NAMES[date.getDay()]}</span>
        <span class="text-base font-semibold">{date.getDate()}</span>
      </button>
    {/each}
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
  {:else if !query.data?.data || query.data.data.length === 0}
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
