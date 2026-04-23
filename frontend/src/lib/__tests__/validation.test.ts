import { describe, it, expect } from 'vitest';
import { bookingSchema, eventTypeSchema } from '../validation/schemas.js';
import { VALID_DURATIONS } from '../../../../shared/constants.js';

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

  it('rejects whitespace-only name', () => {
    const result = bookingSchema.safeParse({ guestName: '   ', guestEmail: 'alice@test.com' });
    expect(result.success).toBe(false);
  });

  it('rejects email without domain', () => {
    const result = bookingSchema.safeParse({ guestName: 'Alice', guestEmail: 'alice@' });
    expect(result.success).toBe(false);
  });

  it('accepts very long name — documents no maxLength', () => {
    const longName = 'A'.repeat(500);
    const result = bookingSchema.safeParse({ guestName: longName, guestEmail: 'alice@test.com' });
    expect(result.success).toBe(true);
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

  it.each(
    VALID_DURATIONS.map((d) => [d]),
  )('accepts valid duration %i', (duration) => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration });
    expect(result.success).toBe(true);
  });

  it('rejects zero duration', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative duration', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: -15 });
    expect(result.success).toBe(false);
  });

  it('rejects string duration', () => {
    const result = eventTypeSchema.safeParse({ name: 'Call', duration: '30' });
    expect(result.success).toBe(false);
  });
});
