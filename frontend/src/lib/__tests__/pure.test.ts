import { describe, it, expect } from 'vitest';
import { getDurationColors } from '../utils.js';
import { bookingSchema, eventTypeSchema } from '../validation/schemas.js';

describe('getDurationColors', () => {
  it('returns sky colors for duration <= 15', () => {
    const result = getDurationColors({ duration: 15 });
    expect(result.badge).toContain('sky');
  });

  it('returns emerald colors for duration <= 20', () => {
    const result = getDurationColors({ duration: 20 });
    expect(result.badge).toContain('emerald');
  });

  it('returns amber colors for duration <= 30', () => {
    const result = getDurationColors({ duration: 30 });
    expect(result.badge).toContain('amber');
  });

  it('returns violet colors for duration > 30', () => {
    const result = getDurationColors({ duration: 60 });
    expect(result.badge).toContain('violet');
  });
});

describe('bookingSchema', () => {
  it('accepts valid input', () => {
    const result = bookingSchema.safeParse({ guestName: 'Alice', guestEmail: 'alice@test.com' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = bookingSchema.safeParse({ guestName: '', guestEmail: 'alice@test.com' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = bookingSchema.safeParse({ guestName: 'Alice', guestEmail: 'not-email' });
    expect(result.success).toBe(false);
  });
});

describe('eventTypeSchema', () => {
  it('accepts valid input', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: 30 });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = eventTypeSchema.safeParse({ name: '', duration: 30 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid duration', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: 25 });
    expect(result.success).toBe(false);
  });
});
