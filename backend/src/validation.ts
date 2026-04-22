import { z } from 'zod';
import type { FastifyReply } from 'fastify';
import { VALID_DURATIONS } from '../../shared/constants.js';

// --- Atomic building blocks (single source of truth) ---

export const UuidSchema = z.string().uuid('must be a valid UUID').describe('UUID v4 identifier');

const durationStrings = VALID_DURATIONS.map(String) as unknown as readonly [string, string, ...string[]];
export const DurationSchema = z.enum(durationStrings).transform(Number)
  .or(z.union([
    z.literal(VALID_DURATIONS[0]),
    z.literal(VALID_DURATIONS[1]),
    z.literal(VALID_DURATIONS[2]),
    z.literal(VALID_DURATIONS[3]),
  ]))
  .describe('Meeting duration in minutes');

export const IsoDatetimeSchema = z.string().datetime('Invalid datetime format').describe('UTC ISO 8601 datetime');

// --- API request schemas (compose from atoms) ---

export const IdParamSchema = z.object({
  id: UuidSchema.describe('Resource ID (UUID v4)'),
});

export const parseIdParam = async ({ params, reply }: { params: unknown; reply: FastifyReply }): Promise<string | null> => {
  const parsed = IdParamSchema.safeParse(params);
  if (!parsed.success) {
    await reply.status(400).send({ message: parsed.error.issues[0].message });
    return null;
  }
  return parsed.data.id;
};

export const CreateEventTypeSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').describe('Display name of the event type'),
  duration: DurationSchema.describe('Meeting duration: 10, 15, 20, or 30 minutes'),
});

export const UpdateEventTypeSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').optional().describe('New display name'),
  duration: DurationSchema.optional().describe('New duration in minutes'),
});

export const CreateBookingSchema = z.object({
  eventTypeId: UuidSchema.describe('ID of the event type to book (UUID v4)'),
  guestName: z.string().min(1, 'Name must not be empty').describe('Guest name'),
  guestEmail: z.string().email('Invalid email address').describe('Guest email'),
  startTime: IsoDatetimeSchema.describe('Slot start time in UTC ISO 8601'),
});

export const SlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').describe('Date for slot lookup'),
  eventTypeId: UuidSchema.describe('Event type ID (UUID v4)'),
});

// --- Full record schemas (for seed data validation & store integrity) ---

export const EventTypeRecordSchema = z.object({
  id: UuidSchema.describe('Event type ID'),
  name: z.string().min(1, 'Name must not be empty').describe('Display name'),
  duration: DurationSchema.describe('Duration in minutes'),
  createdAt: IsoDatetimeSchema.describe('Creation timestamp'),
});

export const BookingRecordSchema = z.object({
  id: UuidSchema.describe('Booking ID'),
  eventTypeId: UuidSchema.describe('Referenced event type ID'),
  eventTypeName: z.string().min(1).describe('Denormalized event type name'),
  duration: DurationSchema.describe('Denormalized duration'),
  guestName: z.string().min(1, 'Name must not be empty').describe('Guest name'),
  guestEmail: z.string().email('Invalid email address').describe('Guest email'),
  startTime: IsoDatetimeSchema.describe('Slot start time'),
  endTime: IsoDatetimeSchema.describe('Slot end time'),
  createdAt: IsoDatetimeSchema.describe('Creation timestamp'),
});
