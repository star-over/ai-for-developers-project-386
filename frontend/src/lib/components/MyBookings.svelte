<script lang="ts">
  import BookingCard from '$lib/components/BookingCard.svelte';
  import { getBookingIds } from '$lib/stores/bookings.svelte.js';
  import { t } from '$lib/i18n/index.js';

  const ids = $derived(getBookingIds());
</script>

<div>
  <h2 class="mb-4 font-display text-xl font-bold">{t.myBookings.title}</h2>

  {#if ids.length === 0}
    <p class="text-center text-muted-foreground">{t.myBookings.empty}</p>
  {:else}
    <div class="flex flex-col gap-3">
      {#each ids as id (id)}
        <BookingCard {id} />
      {/each}
    </div>
  {/if}
</div>
