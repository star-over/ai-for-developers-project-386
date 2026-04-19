import { describe, it, expect } from 'vitest';
import { createStore } from '../src/store.js';

describe('Store', () => {
  it('creates empty store when seed=false', () => {
    const store = createStore({ seed: false });
    expect(store.eventTypes.size).toBe(0);
    expect(store.bookings.size).toBe(0);
  });

  it('loads JSONL seed data when seed=true', () => {
    const store = createStore({ seed: true });
    expect(store.eventTypes.size).toBeGreaterThan(0);
    expect(store.bookings.size).toBeGreaterThan(0);
  });

  it('Map operations work correctly', () => {
    const store = createStore();
    store.eventTypes.set('test-1', {
      id: 'test-1',
      name: 'Test',
      duration: 30,
      createdAt: new Date().toISOString(),
    });
    expect(store.eventTypes.get('test-1')?.name).toBe('Test');
    store.eventTypes.delete('test-1');
    expect(store.eventTypes.has('test-1')).toBe(false);
  });
});
