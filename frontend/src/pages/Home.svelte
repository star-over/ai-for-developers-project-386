<script lang="ts">
  import { goto } from '@mateothegreat/svelte5-router';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import { Button } from '$lib/components/ui/button/index.js';
  import MyBookings from '$lib/components/MyBookings.svelte';
  import { t } from '$lib/i18n/index.js';
</script>

<div class="mx-auto max-w-lg p-6">
  <!-- Host profile -->
  <div class="mb-8 flex flex-col items-center text-center">
    <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
      <CalendarIcon class="h-10 w-10" />
    </div>
    <h1 class="text-2xl font-bold">{t.home.title}</h1>
    <p class="mt-2 text-muted-foreground">{t.home.subtitle}</p>
    <Button class="mt-6 w-full max-w-xs" onclick={() => goto('/booking')}>
      {t.home.cta}
    </Button>
  </div>

  <!-- My bookings -->
  <MyBookings />
</div>
