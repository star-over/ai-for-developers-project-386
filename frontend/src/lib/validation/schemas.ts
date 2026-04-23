import { z } from 'zod';
import { VALID_DURATIONS } from '../../../../shared/constants.js';

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
    .refine((v) => (VALID_DURATIONS as readonly number[]).includes(v), 'Недопустимая длительность')
    .describe('Длительность встречи в минутах'),
});
