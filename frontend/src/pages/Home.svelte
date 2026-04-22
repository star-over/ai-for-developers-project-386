<script lang="ts">
  import { goto } from '@mateothegreat/svelte5-router';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import { Button } from '$lib/components/ui/button/index.js';
  import MyBookings from '$lib/components/MyBookings.svelte';
  import { t } from '$lib/i18n/index.js';
</script>

<div class="mx-auto max-w-lg p-6">
  <!-- Hero -->
  <div class="mb-8 flex flex-col items-center text-center">
    <div
      class="animate-fade-in-up mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"
    >
      <CalendarIcon class="h-10 w-10" />
    </div>
    <h1
      class="animate-fade-in-up font-display text-2xl font-bold"
      style="animation-delay: 80ms"
    >
      {t.home.title}
    </h1>
    <p
      class="animate-fade-in-up mt-2 text-muted-foreground"
      style="animation-delay: 160ms"
    >
      {t.home.subtitle}
    </p>
    <Button
      class="animate-fade-in-up mt-6 w-full max-w-xs"
      style="animation-delay: 240ms"
      onclick={() => goto('/booking')}
    >
      {t.home.cta}
    </Button>
  </div>

  <!-- My bookings -->
  <div class="animate-fade-in-up" style="animation-delay: 320ms">
    <MyBookings />
  </div>
</div>
