<script lang="ts">
  import type { RouteResult } from '@mateothegreat/svelte5-router';
  import { createEventTypesList } from '$lib/api/default/default.js';
  import SlotPicker from '$lib/components/SlotPicker.svelte';
  import BookingForm from '$lib/components/BookingForm.svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';

  let { route }: { route?: RouteResult } = $props();

  const eventTypeId = $derived(route?.result?.path?.params?.eventTypeId as string ?? '');

  const query = createEventTypesList();

  const eventType = $derived(
    query.data?.data?.find((et) => et.id === eventTypeId),
  );

  let selectedSlot = $state<string | null>(null);
</script>

<div class="mx-auto max-w-lg p-4">
  {#if query.isPending}
    <div class="h-8 w-48 animate-pulse rounded bg-muted"></div>
  {:else if eventType}
    <div class="mb-6">
      <h1 class="text-xl font-bold">{eventType.name}</h1>
      <Badge variant="secondary" class="mt-1">{eventType.duration} мин</Badge>
    </div>
  {/if}

  {#if eventTypeId}
    <div class="mb-6">
      <SlotPicker {eventTypeId} onSlotSelect={(t) => { selectedSlot = t; }} />
    </div>

    {#if selectedSlot}
      <div class="rounded-lg border p-4">
        <h2 class="mb-4 text-base font-semibold">Ваши данные</h2>
        <BookingForm {eventTypeId} startTime={selectedSlot} />
      </div>
    {/if}
  {/if}
</div>
