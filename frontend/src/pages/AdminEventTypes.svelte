<script lang="ts">
  import {
    createEventTypesList,
    createEventTypesCreate,
    createByIdUpdate,
    createByIdDelete,
    getEventTypesListQueryKey,
  } from '$lib/api/default/default.js';
  import type { EventType, Duration } from '$lib/api/model/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import ResponsiveModal from '$lib/components/ResponsiveModal.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import EventTypeCardContent from '$lib/components/EventTypeCardContent.svelte';
  import { Label } from '$lib/components/ui/label/index.js';
  import { eventTypeSchema } from '$lib/validation/schemas.js';
  import { t } from '$lib/i18n/index.js';
  import { VALID_DURATIONS } from '../../../shared/constants.js';
  import { useQueryClient } from '@tanstack/svelte-query';

  const queryClient = useQueryClient();

  const query = createEventTypesList();
  const createMutation = createEventTypesCreate();
  const updateMutation = createByIdUpdate();
  const deleteMutation = createByIdDelete();

  let sheetOpen = $state(false);
  let editingId = $state<string | null>(null);
  let formName = $state('');
  let formDuration = $state<Duration>(30);
  let formErrors = $state<{ name?: string; duration?: string }>({});
  let deleteTarget = $state<EventType | null>(null);

  const openCreate = () => {
    editingId = null;
    formName = '';
    formDuration = 30;
    formErrors = {};
    sheetOpen = true;
  };

  const openEdit = ({ et }: { et: EventType }) => {
    editingId = et.id;
    formName = et.name;
    formDuration = et.duration;
    formErrors = {};
    sheetOpen = true;
  };

  const handleSave = () => {
    formErrors = {};
    const result = eventTypeSchema.safeParse({ name: formName, duration: formDuration });
    if (!result.success) {
      const fe = result.error.flatten().fieldErrors;
      formErrors = { name: fe.name?.[0], duration: fe.duration?.[0] };
      return;
    }

    const onSuccess = () => {
      sheetOpen = false;
      queryClient.invalidateQueries({ queryKey: getEventTypesListQueryKey() });
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: { name: formName, duration: formDuration } },
        { onSuccess },
      );
    } else {
      createMutation.mutate(
        { data: { name: formName, duration: formDuration } },
        { onSuccess },
      );
    }
  };

  const handleDelete = ({ id }: { id: string }) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        deleteTarget = null;
        queryClient.invalidateQueries({ queryKey: getEventTypesListQueryKey() });
      },
    });
  };

  const isPending = $derived(createMutation.isPending || updateMutation.isPending);

  const formTitle = $derived(editingId ? t.admin.eventTypes.edit : t.admin.eventTypes.create);
</script>

<div class="mx-auto max-w-lg p-4">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="font-display text-2xl font-bold">{t.admin.eventTypes.title}</h1>
    <Button onclick={openCreate}>{t.admin.eventTypes.create}</Button>
  </div>

  {#if query.isPending}
    {#each [1, 2] as i (i)}
      <div class="mb-3 h-20 animate-pulse rounded-lg bg-muted"></div>
    {/each}
  {:else if query.isError}
    <div class="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
      <p class="mb-3 text-destructive">{t.common.error}</p>
      <Button variant="outline" onclick={() => query.refetch()}>{t.common.retry}</Button>
    </div>
  {:else if !query.data?.data || query.data.data.length === 0}
    <p class="text-center text-muted-foreground">{t.admin.eventTypes.empty}</p>
  {:else}
    <div class="flex flex-col gap-3">
      {#each query.data.data as et, i (et.id)}
        <Card.Root class="animate-fade-in-up" style="animation-delay: {i * 60}ms">
          <Card.Content class="px-4 py-3">
            <EventTypeCardContent name={et.name} duration={et.duration}>
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
                    <DropdownMenu.Item onSelect={() => openEdit({ et })}>
                      <PencilIcon class="mr-2 h-4 w-4" />
                      {t.admin.eventTypes.edit}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      class="text-destructive focus:text-destructive"
                      onSelect={() => { deleteTarget = et; }}
                    >
                      <Trash2Icon class="mr-2 h-4 w-4" />
                      {t.admin.eventTypes.delete}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              {/snippet}
            </EventTypeCardContent>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>

{#snippet formFields()}
  <div class="flex flex-col gap-4 px-4 py-2">
    <div class="flex flex-col gap-1">
      <Label for="et-name">{t.admin.eventTypes.form.name}</Label>
      <Input
        id="et-name"
        autocomplete="off"
        bind:value={formName}
        placeholder={t.admin.eventTypes.form.namePlaceholder}
        class={formErrors.name ? 'border-destructive' : ''}
      />
      {#if formErrors.name}
        <p class="text-xs text-destructive">{formErrors.name}</p>
      {/if}
    </div>

    <div class="flex flex-col gap-1">
      <Label for="et-duration">{t.admin.eventTypes.form.duration}</Label>
      <select
        id="et-duration"
        bind:value={formDuration}
        class="h-10 w-full rounded-3xl border border-border bg-background shadow-sm px-3 py-2 text-sm"
      >
        {#each VALID_DURATIONS as d (d)}
          <option value={d}>{d} {t.eventTypes.minutes}</option>
        {/each}
      </select>
    </div>
  </div>
{/snippet}

<ResponsiveModal bind:open={sheetOpen} title={formTitle}>
  {@render formFields()}
  {#snippet footer()}
    <Button variant="outline" onclick={() => { sheetOpen = false; }}>
      {t.admin.eventTypes.form.cancel}
    </Button>
    <Button onclick={handleSave} disabled={isPending}>
      {isPending ? t.common.loading : editingId ? t.admin.eventTypes.form.save : t.admin.eventTypes.create}
    </Button>
  {/snippet}
</ResponsiveModal>

<ResponsiveModal
  open={!!deleteTarget}
  onOpenChange={(open) => { if (!open) deleteTarget = null; }}
  title={t.admin.eventTypes.confirmDelete}
  description={deleteTarget?.name}
>
  {#snippet footer()}
    <Button variant="outline" onclick={() => { deleteTarget = null; }}>
      {t.admin.eventTypes.form.cancel}
    </Button>
    <Button
      variant="destructive"
      disabled={deleteMutation.isPending}
      onclick={() => deleteTarget && handleDelete({ id: deleteTarget.id })}
    >
      {t.admin.eventTypes.delete}
    </Button>
  {/snippet}
</ResponsiveModal>
