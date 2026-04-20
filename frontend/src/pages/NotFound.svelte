<script lang="ts">
  import { goto } from '@mateothegreat/svelte5-router';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { Button } from '$lib/components/ui/button/index.js';
  import { t } from '$lib/i18n/index.js';
</script>

<div class="mx-auto max-w-lg p-6">
  <div class="flex flex-col items-center text-center">
    <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
      <TriangleAlert class="h-10 w-10" />
    </div>
    <h1 class="text-2xl font-bold">{t.notFound.title}</h1>
    <p class="mt-2 text-muted-foreground">{t.notFound.subtitle}</p>
    <Button class="mt-6 w-full max-w-xs" onclick={() => goto('/')}>
      {t.notFound.cta}
    </Button>
  </div>
</div>
