import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { EventTypeRecordSchema, BookingRecordSchema } from '../src/validation.js';

type EventTypeRecord = z.infer<typeof EventTypeRecordSchema>;
type BookingRecord = z.infer<typeof BookingRecordSchema>;

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', 'data');

const loadJsonl = <T>({ filePath }: { filePath: string }): T[] => {
  const lines = readFileSync(filePath, 'utf-8').trim().split('\n');
  return lines.filter((l) => l.trim()).map((l) => JSON.parse(l) as T);
};

describe('Seed data integrity', () => {
  const rawEventTypes = loadJsonl<EventTypeRecord>({
    filePath: resolve(dataDir, 'event-types.jsonl'),
  });
  const rawBookings = loadJsonl<BookingRecord>({
    filePath: resolve(dataDir, 'bookings.jsonl'),
  });

  describe('event-types.jsonl', () => {
    it('has at least one event type', () => {
      expect(rawEventTypes.length).toBeGreaterThan(0);
    });

    it('every record passes EventTypeRecordSchema', () => {
      for (const raw of rawEventTypes) {
        const result = EventTypeRecordSchema.safeParse(raw);
        expect(result.success, `invalid event type: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      }
    });

    it('all IDs are unique', () => {
      const ids = rawEventTypes.map((et) => et.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('bookings.jsonl', () => {
    it('has at least one booking', () => {
      expect(rawBookings.length).toBeGreaterThan(0);
    });

    it('every record passes BookingRecordSchema', () => {
      for (const raw of rawBookings) {
        const result = BookingRecordSchema.safeParse(raw);
        expect(result.success, `invalid booking: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      }
    });

    it('all IDs are unique', () => {
      const ids = rawBookings.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all eventTypeIds reference existing event types', () => {
      const eventTypeIds = new Set(rawEventTypes.map((et) => et.id));
      for (const b of rawBookings) {
        expect(
          eventTypeIds.has(b.eventTypeId),
          `booking "${b.guestName}" references non-existent eventTypeId "${b.eventTypeId}"`,
        ).toBe(true);
      }
    });

    it('denormalized fields match referenced event type', () => {
      const byId = new Map(rawEventTypes.map((et) => [et.id, et]));
      for (const b of rawBookings) {
        const et = byId.get(b.eventTypeId);
        expect(b.eventTypeName, `booking "${b.guestName}" eventTypeName mismatch`).toBe(et?.name);
        expect(b.duration, `booking "${b.guestName}" duration mismatch`).toBe(et?.duration);
      }
    });
  });
});
