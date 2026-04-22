<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { getIsDesktop } from '$lib/stores/mediaQuery.svelte.js';

  let {
    open = $bindable(false),
    onOpenChange,
    title,
    description,
    contentClass,
    children,
    footer,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title: string;
    description?: string;
    contentClass?: string;
    children?: Snippet;
    footer?: Snippet;
  } = $props();

  const isDesktop = $derived(getIsDesktop());
</script>

{#if isDesktop}
  <Dialog.Root bind:open {onOpenChange}>
    <Dialog.Content class={contentClass ?? 'sm:max-w-md'}>
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
        {#if description}
          <Dialog.Description>{description}</Dialog.Description>
        {/if}
      </Dialog.Header>
      {#if children}
        {@render children()}
      {/if}
      {#if footer}
        <Dialog.Footer>
          {@render footer()}
        </Dialog.Footer>
      {/if}
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Sheet.Root bind:open {onOpenChange}>
    <Sheet.Content side="bottom" class={contentClass ?? 'max-h-[80vh]'}>
      <Sheet.Header>
        <Sheet.Title>{title}</Sheet.Title>
        {#if description}
          <Sheet.Description>{description}</Sheet.Description>
        {/if}
      </Sheet.Header>
      <div class="min-h-0 flex-1 overflow-y-auto">
        {#if children}
          {@render children()}
        {/if}
        {#if footer}
          <Sheet.Footer class="px-4 pb-4">
            {@render footer()}
          </Sheet.Footer>
        {/if}
      </div>
    </Sheet.Content>
  </Sheet.Root>
{/if}
