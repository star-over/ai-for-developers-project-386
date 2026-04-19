<script lang="ts">
  import type { RouteResult } from '@mateothegreat/svelte5-router';
  import { createEventTypesList } from '$lib/api/default/default.js';
  import SlotPicker from '$lib/components/SlotPicker.svelte';
  import BookingForm from '$lib/components/BookingForm.svelte';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { t } from '$lib/i18n/index.js';

  let { route }: { route?: RouteResult } = $props();

  const eventTypeId = $derived(route?.result?.path?.params?.eventTypeId as string ?? '');
  const query = createEventTypesList();
  const eventType = $derived(query.data?.data?.find((et) => et.id === eventTypeId));

  let selectedSlot = $state<string | null>(null);
  let formOpen = $state(false);

  let innerWidth = $state(window.innerWidth);
  $effect(() => {
    const onResize = () => { innerWidth = window.innerWidth; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
  const isDesktop = $derived(innerWidth >= 768);

  const handleSlotSelect = (startTime: string) => {
    selectedSlot = startTime;
    formOpen = true;
  };

  const closeForm = () => {
    formOpen = false;
    selectedSlot = null;
  };

  const formatSlotDate = ({ isoStr }: { isoStr: string }) =>
    new Date(isoStr).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatSlotTime = ({ isoStr }: { isoStr: string }) =>
    new Date(isoStr).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
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
    <SlotPicker {eventTypeId} onSlotSelect={handleSlotSelect} />
  {/if}
</div>

{#snippet bookingSummary()}
  {#if eventType && selectedSlot}
    <div class="mx-4 my-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
      <p class="font-medium">{eventType.name}</p>
      <p class="mt-1 text-muted-foreground">
        {formatSlotDate({ isoStr: selectedSlot })} · {formatSlotTime({ isoStr: selectedSlot })}
      </p>
      <Badge variant="secondary" class="mt-2">{eventType.duration} мин</Badge>
    </div>
  {/if}
{/snippet}

<!-- Desktop: centered Dialog -->
{#if isDesktop}
  <Dialog.Root bind:open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>{t.booking.formTitle}</Dialog.Title>
      </Dialog.Header>
      {@render bookingSummary()}
      <div class="px-4 py-2">
        {#if selectedSlot}
          <BookingForm {eventTypeId} startTime={selectedSlot} onCancel={closeForm} />
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Root>

<!-- Mobile: bottom Sheet -->
{:else}
  <Sheet.Root bind:open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
    <Sheet.Content side="bottom" class="max-h-[80vh]">
      <Sheet.Header>
        <Sheet.Title>{t.booking.formTitle}</Sheet.Title>
      </Sheet.Header>
      {@render bookingSummary()}
      <div class="px-4 py-2 pb-4">
        {#if selectedSlot}
          <BookingForm {eventTypeId} startTime={selectedSlot} onCancel={closeForm} />
        {/if}
      </div>
    </Sheet.Content>
  </Sheet.Root>
{/if}
