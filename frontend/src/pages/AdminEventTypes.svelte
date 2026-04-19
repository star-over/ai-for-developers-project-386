<script lang="ts">
  import {
    createEventTypesList,
    createEventTypesCreate,
    createByIdUpdate,
    createByIdDelete,
    getEventTypesListQueryKey,
  } from '$lib/api/default/default.js';
  import type { EventType } from '$lib/api/model/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { eventTypeSchema } from '$lib/validation/schemas.js';
  import { t } from '$lib/i18n/index.js';
  import { useQueryClient } from '@tanstack/svelte-query';

  const queryClient = useQueryClient();

  const query = createEventTypesList();
  const createMutation = createEventTypesCreate();
  const updateMutation = createByIdUpdate();
  const deleteMutation = createByIdDelete();

  let sheetOpen = $state(false);
  let editingId = $state<string | null>(null);
  let formName = $state('');
  let formDuration = $state(30);
  let formErrors = $state<{ name?: string; duration?: string }>({});
  let deleteTarget = $state<EventType | null>(null);

  let innerWidth = $state(window.innerWidth);
  $effect(() => {
    const onResize = () => { innerWidth = window.innerWidth; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
  const isDesktop = $derived(innerWidth >= 768);

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
    <h1 class="text-2xl font-bold">{t.admin.eventTypes.title}</h1>
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
    <p class="text-center text-muted-foreground">Нет типов событий</p>
  {:else}
    <div class="flex flex-col gap-3">
      {#each query.data.data as et (et.id)}
        <Card.Root>
          <Card.Content class="flex min-h-[64px] items-center justify-between p-4">
            <div>
              <p class="font-medium">{et.name}</p>
              <Badge variant="secondary" class="mt-1">{et.duration} мин</Badge>
            </div>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onclick={() => openEdit({ et })}>
                {t.admin.eventTypes.edit}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                onclick={() => { deleteTarget = et; }}
              >
                {t.admin.eventTypes.delete}
              </Button>
            </div>
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
        class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {#each [10, 15, 20, 30] as d (d)}
          <option value={d}>{d} мин</option>
        {/each}
      </select>
    </div>
  </div>
{/snippet}

<!-- Desktop: centered Dialog -->
{#if isDesktop}
  <Dialog.Root bind:open={sheetOpen}>
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>{formTitle}</Dialog.Title>
      </Dialog.Header>
      {@render formFields()}
      <Dialog.Footer class="px-4 pb-2">
        <Dialog.Close>
          {#snippet child({ props })}
            <Button {...props} variant="outline">{t.admin.eventTypes.form.cancel}</Button>
          {/snippet}
        </Dialog.Close>
        <Button onclick={handleSave} disabled={isPending}>
          {isPending ? t.common.loading : t.admin.eventTypes.form.save}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>

<!-- Mobile: bottom Sheet -->
{:else}
  <Sheet.Root bind:open={sheetOpen}>
    <Sheet.Content side="bottom" class="max-h-[80vh]">
      <Sheet.Header>
        <Sheet.Title>{formTitle}</Sheet.Title>
      </Sheet.Header>
      {@render formFields()}
      <Sheet.Footer class="px-4 pb-4">
        <Sheet.Close>
          {#snippet child({ props })}
            <Button {...props} variant="outline">{t.admin.eventTypes.form.cancel}</Button>
          {/snippet}
        </Sheet.Close>
        <Button onclick={handleSave} disabled={isPending}>
          {isPending ? t.common.loading : t.admin.eventTypes.form.save}
        </Button>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet.Root>
{/if}

<!-- Delete confirmation: Desktop Dialog / Mobile Sheet -->
{#if isDesktop}
  <Dialog.Root open={!!deleteTarget} onOpenChange={(open) => { if (!open) deleteTarget = null; }}>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>{t.admin.eventTypes.confirmDelete}</Dialog.Title>
        {#if deleteTarget}
          <Dialog.Description>{deleteTarget.name}</Dialog.Description>
        {/if}
      </Dialog.Header>
      <Dialog.Footer>
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
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Sheet.Root open={!!deleteTarget} onOpenChange={(open) => { if (!open) deleteTarget = null; }}>
    <Sheet.Content side="bottom">
      <Sheet.Header>
        <Sheet.Title>{t.admin.eventTypes.confirmDelete}</Sheet.Title>
        {#if deleteTarget}
          <Sheet.Description>{deleteTarget.name}</Sheet.Description>
        {/if}
      </Sheet.Header>
      <Sheet.Footer class="px-4 pb-4">
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
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet.Root>
{/if}
