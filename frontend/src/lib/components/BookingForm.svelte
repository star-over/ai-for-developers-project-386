<script lang="ts">
  import { goto } from '@mateothegreat/svelte5-router';
  import { createBookingsCreate } from '$lib/api/default/default.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import UserIcon from '@lucide/svelte/icons/user';
  import MailIcon from '@lucide/svelte/icons/mail';
  import { bookingSchema } from '$lib/validation/schemas.js';
  import { addBookingId } from '$lib/stores/bookings.svelte.js';
  import { getGuestProfile, saveGuestProfile } from '$lib/stores/guestProfile.svelte.js';
  import { t } from '$lib/i18n/index.js';

  const { eventTypeId, startTime }: {
    eventTypeId: string;
    startTime: string;
  } = $props();

  const profile = getGuestProfile();
  let guestName = $state(profile.name);
  let guestEmail = $state(profile.email);
  let errors = $state<{ guestName?: string; guestEmail?: string }>({});
  let serverError = $state('');
  let success = $state(false);

  const mutation = createBookingsCreate();

  const handleSubmit = async () => {
    errors = {};
    serverError = '';

    const result = bookingSchema.safeParse({ guestName, guestEmail });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      errors = {
        guestName: fieldErrors.guestName?.[0],
        guestEmail: fieldErrors.guestEmail?.[0],
      };
      return;
    }

    mutation.mutate(
      { data: { eventTypeId, startTime, guestName, guestEmail } },
      {
        onSuccess: (response) => {
          if (response.status !== 201) return;
          saveGuestProfile({ name: guestName, email: guestEmail });
          addBookingId({ id: response.data.id });
          success = true;
          setTimeout(() => goto('/'), 1500);
        },
        onError: (err) => {
          const status = (err as { status?: number }).status;
          if (status === 409) {
            serverError = t.booking.conflict;
          } else {
            serverError = t.common.error;
          }
        },
      },
    );
  };
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex flex-col gap-4">
  {#if success}
    <div class="flex flex-col items-center gap-3 rounded-xl bg-primary/10 p-6 text-center">
      <div class="animate-scale-check flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p class="animate-fade-in-up text-sm font-medium text-primary" style="animation-delay: 200ms">
        {t.booking.success}
      </p>
    </div>
  {:else}
    <div class="flex flex-col gap-1">
      <Label for="guestName">{t.booking.form.name}</Label>
      <div class="relative">
        <UserIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="guestName"
          autocomplete="off"
          bind:value={guestName}
          placeholder={t.booking.form.namePlaceholder}
          class="pl-9 {errors.guestName ? 'border-destructive' : ''}"
        />
      </div>
      {#if errors.guestName}
        <p class="text-xs text-destructive">{errors.guestName}</p>
      {/if}
    </div>

    <div class="flex flex-col gap-1">
      <Label for="guestEmail">{t.booking.form.email}</Label>
      <div class="relative">
        <MailIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <!-- type="text" intentional — type="email" triggers ugly browser validation bubbles; Zod handles validation -->
        <Input
          id="guestEmail"
          type="text"
          autocomplete="off"
          bind:value={guestEmail}
          placeholder={t.booking.form.emailPlaceholder}
          class="pl-9 {errors.guestEmail ? 'border-destructive' : ''}"
        />
      </div>
      {#if errors.guestEmail}
        <p class="text-xs text-destructive">{errors.guestEmail}</p>
      {/if}
    </div>

    {#if serverError}
      <p class="text-sm text-destructive">{serverError}</p>
    {/if}

    <Button type="submit" disabled={mutation.isPending} class="w-full">
      {mutation.isPending ? t.common.loading : t.booking.form.submit}
    </Button>
  {/if}
</form>
