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
    store.eventTypes.set('f47ac10b-58cc-4372-a567-0e02b2c3d479', {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Test',
      duration: 30,
      createdAt: new Date().toISOString(),
    });
    expect(store.eventTypes.get('f47ac10b-58cc-4372-a567-0e02b2c3d479')?.name).toBe('Test');
    store.eventTypes.delete('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(store.eventTypes.has('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(false);
  });
});
