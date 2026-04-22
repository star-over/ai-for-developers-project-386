<script lang="ts">
  import type { RouteResult } from '@mateothegreat/svelte5-router';
  import { createEventTypesList } from '$lib/api/default/default.js';
  import SlotPicker from '$lib/components/SlotPicker.svelte';
  import BookingForm from '$lib/components/BookingForm.svelte';
  import ResponsiveModal from '$lib/components/ResponsiveModal.svelte';
  import { getSelectedEventType } from '$lib/stores/selectedEventType.svelte.js';
  import BookingCardContent from '$lib/components/BookingCardContent.svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import { t } from '$lib/i18n/index.js';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import { getDurationColors } from '$lib/utils.js';
  import NotFound from './NotFound.svelte';

  const { route }: { route?: RouteResult } = $props();

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
    {@const colors = getDurationColors({ duration: displayEventType.duration })}
    <div class="mb-6 border-l-4 pl-3 {colors.border}">
      <p class="text-sm font-semibold leading-snug">{displayEventType.name}</p>
      <span class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {colors.badge}">
        <ClockIcon class="h-3 w-3" />
        {displayEventType.duration} {t.eventTypes.minutes}
      </span>
    </div>
  {/if}

  {#if eventTypeId}
    <SlotPicker {eventTypeId} onSlotSelect={handleSlotSelect} />
  {/if}
</div>

{#snippet bookingSummary()}
  {#if displayEventType && selectedSlot}
    <Card.Root class="mx-4 -mt-2 mb-2 gap-0 overflow-visible rounded-xl py-0">
      <Card.Content class="p-2">
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
      <BookingForm {eventTypeId} startTime={selectedSlot} />
    {/if}
  </div>
</ResponsiveModal>
{/if}
