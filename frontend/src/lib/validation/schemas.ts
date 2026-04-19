import { z } from 'zod';

export const bookingSchema = z.object({
  guestName: z
    .string()
    .min(1, 'Имя обязательно')
    .describe('Имя гостя для бронирования'),
  guestEmail: z
    .string()
    .email('Некорректный email')
    .describe('Email гостя для подтверждения бронирования'),
});

export const eventTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Название обязательно')
    .describe('Название типа события'),
  duration: z
    .number()
    .refine((v) => [10, 15, 20, 30].includes(v), 'Недопустимая длительность')
    .describe('Длительность встречи в минутах'),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
export type EventTypeFormData = z.infer<typeof eventTypeSchema>;
