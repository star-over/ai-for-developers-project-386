<script lang="ts">
  import { createByIdGet, createByIdCancel } from '$lib/api/default/default.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import BookingCardContent from '$lib/components/BookingCardContent.svelte';
  import ResponsiveModal from '$lib/components/ResponsiveModal.svelte';
  import { removeBookingId } from '$lib/stores/bookings.svelte.js';
  import { t } from '$lib/i18n/index.js';

  const { id, onCanceled }: { id: string; onCanceled?: () => void } = $props();

  const bookingQuery = createByIdGet(() => id);
  const cancelMutation = createByIdCancel();
  let dialogOpen = $state(false);

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
        onCanceled?.();
      },
      onError: () => {
        dialogOpen = false;
        removeBookingId({ id });
      },
    });
  };
</script>

{#if bookingQuery.isSuccess && bookingQuery.data?.status === 200}
  {@const booking = bookingQuery.data.data}
  <Card.Root>
    <Card.Content class="p-4">
      <BookingCardContent
        eventTypeName={booking.eventTypeName}
        startTime={booking.startTime}
        duration={booking.duration}
      >
        {#snippet actions()}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button {...props} variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground">
                  <MoreVerticalIcon class="h-4 w-4" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="w-40">
              <DropdownMenu.Item
                class="text-destructive focus:text-destructive"
                onSelect={() => { dialogOpen = true; }}
              >
                <Trash2Icon class="mr-2 h-4 w-4" />
                {t.myBookings.confirmAction}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/snippet}
      </BookingCardContent>
    </Card.Content>
  </Card.Root>

  <ResponsiveModal bind:open={dialogOpen} title={t.myBookings.confirmTitle} description={booking.eventTypeName}>
    {#snippet footer()}
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
    {/snippet}
  </ResponsiveModal>
{/if}
