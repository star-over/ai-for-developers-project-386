<script lang="ts">
  import { goto } from '@mateothegreat/svelte5-router';
  import { createBookingsCreate } from '$lib/api/default/default.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { bookingSchema } from '$lib/validation/schemas.js';
  import { addBookingId } from '$lib/stores/bookings.svelte.js';
  import { getGuestProfile, saveGuestProfile } from '$lib/stores/guestProfile.svelte.js';
  import { t } from '$lib/i18n/index.js';

  let { eventTypeId, startTime, onCancel }: {
    eventTypeId: string;
    startTime: string;
    onCancel?: () => void;
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
    <div class="rounded-md bg-green-50 p-4 text-center text-green-700">
      {t.booking.success}
    </div>
  {:else}
    <div class="flex flex-col gap-1">
      <Label for="guestName">{t.booking.form.name}</Label>
      <Input
        id="guestName"
        bind:value={guestName}
        placeholder={t.booking.form.namePlaceholder}
        class={errors.guestName ? 'border-destructive' : ''}
      />
      {#if errors.guestName}
        <p class="text-xs text-destructive">{errors.guestName}</p>
      {/if}
    </div>

    <div class="flex flex-col gap-1">
      <Label for="guestEmail">{t.booking.form.email}</Label>
      <Input
        id="guestEmail"
        type="text"
        bind:value={guestEmail}
        placeholder={t.booking.form.emailPlaceholder}
        class={errors.guestEmail ? 'border-destructive' : ''}
      />
      {#if errors.guestEmail}
        <p class="text-xs text-destructive">{errors.guestEmail}</p>
      {/if}
    </div>

    {#if serverError}
      <p class="text-sm text-destructive">{serverError}</p>
    {/if}

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {#if onCancel}
        <Button type="button" variant="outline" onclick={onCancel}>
          {t.booking.form.cancel}
        </Button>
      {/if}
      <Button type="submit" disabled={mutation.isPending} class={onCancel ? '' : 'w-full'}>
        {mutation.isPending ? t.common.loading : t.booking.form.submit}
      </Button>
    </div>
  {/if}
</form>
