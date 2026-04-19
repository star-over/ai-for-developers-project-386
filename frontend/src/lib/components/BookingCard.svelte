<script lang="ts">
  import { createByIdGet, createByIdCancel } from '$lib/api/default/default.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
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

  const formatDateTime = ({ isoStr }: { isoStr: string }) => {
    const d = new Date(isoStr);
    return d.toLocaleString('ru', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

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
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1">
          <p class="font-medium">{booking.eventTypeName}</p>
          <p class="mt-1 text-sm">{formatDateTime({ isoStr: booking.startTime })}</p>
          <Badge variant="secondary" class="mt-1">{booking.duration} мин</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive hover:text-destructive"
          onclick={() => { dialogOpen = true; }}
        >
          {t.myBookings.cancel}
        </Button>
      </div>
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
