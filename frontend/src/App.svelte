<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { Router } from '@mateothegreat/svelte5-router';
  import Layout from '$lib/components/Layout.svelte';
  import Home from './pages/Home.svelte';
  import EventTypes from './pages/EventTypes.svelte';
  import Booking from './pages/Booking.svelte';
  import AdminBookings from './pages/AdminBookings.svelte';
  import AdminEventTypes from './pages/AdminEventTypes.svelte';

  const queryClient = new QueryClient();

  const routes = [
    { path: '/', component: Home },
    { path: '/booking', component: EventTypes },
    { path: '/admin', component: AdminBookings },
    { path: '/admin/event-types', component: AdminEventTypes },
    { path: /^\/booking\/(?<eventTypeId>[^/]+)$/, component: Booking },
  ];
</script>

<QueryClientProvider client={queryClient}>
  <Layout>
    <Router {routes} />
  </Layout>
</QueryClientProvider>
