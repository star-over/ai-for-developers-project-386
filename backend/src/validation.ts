import { z } from 'zod';

export const DurationSchema = z.enum(['10', '15', '20', '30']).transform(Number)
  .or(z.literal(10).or(z.literal(15)).or(z.literal(20)).or(z.literal(30)))
  .describe('Meeting duration in minutes');

export const CreateEventTypeSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').describe('Display name of the event type'),
  duration: DurationSchema.describe('Meeting duration: 10, 15, 20, or 30 minutes'),
});

export const UpdateEventTypeSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').optional().describe('New display name'),
  duration: DurationSchema.optional().describe('New duration in minutes'),
});

export const CreateBookingSchema = z.object({
  eventTypeId: z.string().min(1, 'eventTypeId is required').describe('ID of the event type to book'),
  guestName: z.string().min(1, 'Name must not be empty').describe('Guest name'),
  guestEmail: z.string().email('Invalid email address').describe('Guest email'),
  startTime: z.string().datetime('Invalid datetime format').describe('Slot start time in UTC ISO 8601'),
});

export const SlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').describe('Date for slot lookup'),
  eventTypeId: z.string().min(1, 'eventTypeId is required').describe('Event type ID'),
});
