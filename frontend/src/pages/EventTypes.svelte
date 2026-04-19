<script lang="ts">
  import { goto } from '@mateothegreat/svelte5-router';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { createEventTypesList } from '$lib/api/default/default.js';
  import type { EventType } from '$lib/api/model/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { setSelectedEventType } from '$lib/stores/selectedEventType.svelte.js';
  import { t } from '$lib/i18n/index.js';

  const query = createEventTypesList();

  const navigate = ({ eventType }: { eventType: EventType }) => {
    setSelectedEventType({ eventType });
    goto(`/booking/${eventType.id}`);
  };
</script>

<div class="mx-auto max-w-lg p-4">
  <h1 class="mb-6 text-2xl font-bold">{t.eventTypes.title}</h1>

  {#if query.isPending}
    <!-- Skeleton loading -->
    {#each [1, 2, 3] as i (i)}
      <div class="mb-3 h-20 animate-pulse rounded-lg bg-muted"></div>
    {/each}
  {:else if query.isError}
    <div class="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
      <p class="mb-3 text-destructive">{t.common.error}</p>
      <Button variant="outline" onclick={() => query.refetch()}>{t.common.retry}</Button>
    </div>
  {:else if !query.data?.data || query.data.data.length === 0}
    <p class="text-center text-muted-foreground">{t.eventTypes.empty}</p>
  {:else}
    <div class="flex flex-col gap-3">
      {#each query.data.data as eventType (eventType.id)}
        <button
          type="button"
          class="w-full text-left"
          onclick={() => navigate({ eventType })}
        >
          <Card.Root class="cursor-pointer transition-colors hover:bg-accent/50">
            <Card.Content class="flex min-h-[64px] items-center justify-between p-4">
              <div>
                <p class="font-medium">{eventType.name}</p>
                <Badge variant="secondary" class="mt-1">
                  {eventType.duration} {t.eventTypes.minutes}
                </Badge>
              </div>
              <ArrowRightIcon class="h-4 w-4 shrink-0 text-muted-foreground" />
            </Card.Content>
          </Card.Root>
        </button>
      {/each}
    </div>
  {/if}
</div>
