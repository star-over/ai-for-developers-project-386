import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const rootEl = document.getElementById('app');
if (!rootEl) throw new Error('Root element #app not found');
const app = mount(App, { target: rootEl });

export default app;
