import { z } from 'zod';
import type { FastifyReply } from 'fastify';

export const IdParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID').describe('Resource ID (UUID v4)'),
});

export const parseIdParam = async ({ params, reply }: { params: unknown; reply: FastifyReply }): Promise<string | null> => {
  const parsed = IdParamSchema.safeParse(params);
  if (!parsed.success) {
    await reply.status(400).send({ message: parsed.error.issues[0].message });
    return null;
  }
  return parsed.data.id;
};

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
  eventTypeId: z.string().uuid('eventTypeId must be a valid UUID').describe('ID of the event type to book (UUID v4)'),
  guestName: z.string().min(1, 'Name must not be empty').describe('Guest name'),
  guestEmail: z.string().email('Invalid email address').describe('Guest email'),
  startTime: z.string().datetime('Invalid datetime format').describe('Slot start time in UTC ISO 8601'),
});

export const SlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').describe('Date for slot lookup'),
  eventTypeId: z.string().uuid('eventTypeId must be a valid UUID').describe('Event type ID (UUID v4)'),
});
