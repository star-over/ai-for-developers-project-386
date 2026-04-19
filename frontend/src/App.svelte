<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
  <main class="min-h-screen bg-background text-foreground">
    <h1 class="text-2xl p-4">Calendar — scaffolding works!</h1>
  </main>
</QueryClientProvider>
