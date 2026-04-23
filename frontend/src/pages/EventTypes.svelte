<script lang="ts">
  import { goto } from '@mateothegreat/svelte5-router';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { createEventTypesList } from '$lib/api/default/default.js';
  import type { EventType } from '$lib/api/model/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import EventTypeCardContent from '$lib/components/EventTypeCardContent.svelte';
  import QueryError from '$lib/components/QueryError.svelte';
  import { setSelectedEventType } from '$lib/stores/selectedEventType.svelte.js';
  import { t } from '$lib/i18n/index.js';

  const query = createEventTypesList();

  const navigate = ({ eventType }: { eventType: EventType }) => {
    setSelectedEventType({ eventType });
    goto(`/booking/${eventType.id}`);
  };
</script>

<div class="mx-auto max-w-lg p-4">
  <h1 class="mb-6 font-display text-2xl font-bold">{t.eventTypes.title}</h1>

  {#if query.isPending}
    {#each [1, 2, 3] as i (i)}
      <div class="mb-3 h-20 animate-pulse rounded-lg bg-muted"></div>
    {/each}
  {:else if query.isError}
    <QueryError onRetry={() => query.refetch()} />
  {:else if !query.data?.data || query.data.data.length === 0}
    <p class="text-center text-muted-foreground">{t.eventTypes.empty}</p>
  {:else}
    <div class="flex flex-col gap-3">
      {#each query.data.data as eventType, i (eventType.id)}
        <button
          type="button"
          class="animate-fade-in-up w-full text-left"
          style="animation-delay: {i * 60}ms"
          onclick={() => navigate({ eventType })}
        >
          <Card.Root class="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
            <Card.Content class="px-4 py-3">
              <EventTypeCardContent name={eventType.name} duration={eventType.duration}>
                {#snippet actions()}
                  <ArrowRightIcon class="h-4 w-4 text-muted-foreground" />
                {/snippet}
              </EventTypeCardContent>
            </Card.Content>
          </Card.Root>
        </button>
      {/each}
    </div>
  {/if}
</div>
