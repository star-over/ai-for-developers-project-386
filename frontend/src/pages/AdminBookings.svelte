<script lang="ts">
  import { createAdminBookingsList } from '$lib/api/default/default.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { t } from '$lib/i18n/index.js';

  const query = createAdminBookingsList();

  const formatDateTime = ({ isoStr }: { isoStr: string }) => {
    const d = new Date(isoStr);
    return d.toLocaleString('ru', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
</script>

<div class="mx-auto max-w-lg p-4">
  <h1 class="mb-6 text-2xl font-bold">{t.admin.bookings.title}</h1>

  {#if query.isPending}
    {#each [1, 2, 3] as i (i)}
      <div class="mb-3 h-24 animate-pulse rounded-lg bg-muted"></div>
    {/each}
  {:else if query.isError}
    <div class="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
      <p class="mb-3 text-destructive">{t.common.error}</p>
      <Button variant="outline" onclick={() => query.refetch()}>{t.common.retry}</Button>
    </div>
  {:else if !query.data?.data || query.data.data.length === 0}
    <p class="text-center text-muted-foreground">{t.admin.bookings.empty}</p>
  {:else}
    <div class="flex flex-col gap-3">
      {#each query.data.data as booking (booking.id)}
        <Card.Root>
          <Card.Content class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <p class="font-medium">{booking.eventTypeName}</p>
                <p class="text-sm text-muted-foreground">{booking.guestName} · {booking.guestEmail}</p>
                <p class="mt-1 text-sm">{formatDateTime({ isoStr: booking.startTime })}</p>
              </div>
              <Badge variant="secondary">{booking.duration} мин</Badge>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
