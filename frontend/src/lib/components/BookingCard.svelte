<script lang="ts">
  import { createByIdGet, createByIdCancel } from '$lib/api/default/default.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import BookingCardContent from '$lib/components/BookingCardContent.svelte';
  import { removeBookingId } from '$lib/stores/bookings.svelte.js';
  import { t } from '$lib/i18n/index.js';

  let { id, onCanceled }: { id: string; onCanceled: () => void } = $props();

  const bookingQuery = createByIdGet(() => id);
  const cancelMutation = createByIdCancel();
  let dialogOpen = $state(false);

  let innerWidth = $state(window.innerWidth);
  $effect(() => {
    const onResize = () => { innerWidth = window.innerWidth; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
  const isDesktop = $derived(innerWidth >= 768);

  $effect(() => {
    if (bookingQuery.isError) {
      removeBookingId({ id });
    }
  });

  const handleCancel = () => {
    cancelMutation.mutate({ id }, {
      onSuccess: () => {
        dialogOpen = false;
        removeBookingId({ id });
        onCanceled();
      },
      onError: () => {
        dialogOpen = false;
        removeBookingId({ id });
      },
    });
  };
</script>

{#if bookingQuery.isSuccess && bookingQuery.data?.data}
  {@const booking = bookingQuery.data.data}
  <Card.Root>
    <Card.Content class="p-4">
      <BookingCardContent
        eventTypeName={booking.eventTypeName}
        startTime={booking.startTime}
        duration={booking.duration}
      >
        {#snippet actions()}
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive"
            onclick={() => { dialogOpen = true; }}
          >
            {t.myBookings.confirmAction}
          </Button>
        {/snippet}
      </BookingCardContent>
    </Card.Content>
  </Card.Root>

  <!-- Desktop: centered Dialog -->
  {#if isDesktop}
    <Dialog.Root bind:open={dialogOpen}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>{t.myBookings.confirmTitle}</Dialog.Title>
          <Dialog.Description>{booking.eventTypeName}</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button variant="outline" onclick={() => { dialogOpen = false; }}>
            {t.admin.eventTypes.form.cancel}
          </Button>
          <Button
            variant="destructive"
            disabled={cancelMutation.isPending}
            onclick={handleCancel}
          >
            {t.myBookings.confirmAction}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>

  <!-- Mobile: bottom Sheet -->
  {:else}
    <Sheet.Root bind:open={dialogOpen}>
      <Sheet.Content side="bottom">
        <Sheet.Header>
          <Sheet.Title>{t.myBookings.confirmTitle}</Sheet.Title>
          <Sheet.Description>{booking.eventTypeName}</Sheet.Description>
        </Sheet.Header>
        <Sheet.Footer class="px-4 pb-4">
          <Button variant="outline" onclick={() => { dialogOpen = false; }}>
            {t.admin.eventTypes.form.cancel}
          </Button>
          <Button
            variant="destructive"
            disabled={cancelMutation.isPending}
            onclick={handleCancel}
          >
            {t.myBookings.confirmAction}
          </Button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet.Root>
  {/if}
{/if}
