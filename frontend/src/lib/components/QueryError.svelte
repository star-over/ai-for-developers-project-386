<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { t } from '$lib/i18n/index.js';

  const { onRetry }: { onRetry: () => void } = $props();
</script>

<div class="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
  <p class="mb-3 text-destructive">{t.common.error}</p>
  <Button variant="outline" onclick={onRetry}>{t.common.retry}</Button>
</div>
