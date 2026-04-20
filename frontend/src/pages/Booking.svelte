<script lang="ts">
  import type { RouteResult } from '@mateothegreat/svelte5-router';
  import { createEventTypesList } from '$lib/api/default/default.js';
  import SlotPicker from '$lib/components/SlotPicker.svelte';
  import BookingForm from '$lib/components/BookingForm.svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import ResponsiveModal from '$lib/components/ResponsiveModal.svelte';
  import { getSelectedEventType } from '$lib/stores/selectedEventType.svelte.js';
  import BookingCardContent from '$lib/components/BookingCardContent.svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import { t } from '$lib/i18n/index.js';
  import NotFound from './NotFound.svelte';

  let { route }: { route?: RouteResult } = $props();

  const eventTypeId = $derived(String((route?.result?.path?.params as Record<string, string>)?.eventTypeId ?? ''));

  // Use store value saved when user clicked the event type card — stable across query refetches
  const selectedEventType = $derived(getSelectedEventType());

  // Also keep query for h1/badge display (falls back gracefully if store is set)
  const query = createEventTypesList();
  const eventTypeFromQuery = $derived(query.data?.data?.find((et) => et.id === eventTypeId));
  const displayEventType = $derived(selectedEventType ?? eventTypeFromQuery);

  // eventType not found after data loaded — invalid ID
  const isNotFound = $derived(!query.isPending && !query.isError && query.data && !eventTypeFromQuery && !selectedEventType);

  let selectedSlot = $state<string | null>(null);
  let formOpen = $state(false);

  const handleSlotSelect = (startTime: string) => {
    selectedSlot = startTime;
    formOpen = true;
  };

  const closeForm = () => {
    formOpen = false;
    selectedSlot = null;
  };

</script>

{#if isNotFound}
  <NotFound />
{:else}
<div class="mx-auto max-w-lg p-4">
  {#if query.isPending}
    <div class="h-8 w-48 animate-pulse rounded bg-muted"></div>
  {:else if displayEventType}
    <div class="mb-6">
      <h1 class="text-xl font-bold">{displayEventType.name}</h1>
      <Badge variant="secondary" class="mt-1">{displayEventType.duration} {t.eventTypes.minutes}</Badge>
    </div>
  {/if}

  {#if eventTypeId}
    <SlotPicker {eventTypeId} onSlotSelect={handleSlotSelect} />
  {/if}
</div>

{#snippet bookingSummary()}
  {#if displayEventType && selectedSlot}
    <Card.Root class="mx-4 my-2">
      <Card.Content class="p-4">
        <BookingCardContent
          eventTypeName={displayEventType.name}
          startTime={selectedSlot}
          duration={displayEventType.duration}
        />
      </Card.Content>
    </Card.Root>
  {/if}
{/snippet}

<ResponsiveModal bind:open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); }} title={t.booking.formTitle}>
  {@render bookingSummary()}
  <div class="px-4 py-2">
    {#if selectedSlot}
      <BookingForm {eventTypeId} startTime={selectedSlot} onCancel={closeForm} />
    {/if}
  </div>
</ResponsiveModal>
{/if}
