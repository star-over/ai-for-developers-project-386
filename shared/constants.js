/** @type {readonly [10, 15, 20, 30]} */
export const VALID_DURATIONS = /** @type {const} */ ([10, 15, 20, 30]);

/**
 * Фиксированный размер слота в минутах.
 * Сетка расписания всегда 30-минутная: любое событие (10/15/20/30 мин)
 * занимает слот целиком.
 */
export const SLOT_DURATION = 30;

export const WORK_START_HOUR = 9;
export const WORK_END_HOUR = 17;
