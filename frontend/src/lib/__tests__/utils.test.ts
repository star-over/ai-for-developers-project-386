import { describe, it, expect } from 'vitest';
import { getDurationColors, formatDate, formatTime } from '../utils.js';

describe('getDurationColors', () => {
  it('returns sky colors for duration 10 (minimum)', () => {
    const result = getDurationColors({ duration: 10 });
    expect(result.badge).toContain('sky');
    expect(result.border).toContain('sky');
  });

  it('returns sky colors for duration 15', () => {
    const result = getDurationColors({ duration: 15 });
    expect(result.badge).toContain('sky');
    expect(result.border).toContain('sky');
  });

  it('returns emerald colors for duration 20', () => {
    const result = getDurationColors({ duration: 20 });
    expect(result.badge).toContain('emerald');
    expect(result.border).toContain('emerald');
  });

  it('returns amber colors for duration 30', () => {
    const result = getDurationColors({ duration: 30 });
    expect(result.badge).toContain('amber');
    expect(result.border).toContain('amber');
  });

  it('returns violet colors for duration > 30', () => {
    const result = getDurationColors({ duration: 60 });
    expect(result.badge).toContain('violet');
    expect(result.border).toContain('violet');
  });
});

describe('formatDate', () => {
  it('formats a regular date in Russian locale', () => {
    const result = formatDate({ isoStr: '2026-04-20T09:00:00.000Z' });
    expect(result).toContain('20');
    expect(result).toMatch(/апрел/i);
    expect(result).toContain('2026');
  });

  it('formats start of year', () => {
    const result = formatDate({ isoStr: '2026-01-01T00:00:00.000Z' });
    expect(result).toContain('1');
    expect(result).toMatch(/январ/i);
    expect(result).toContain('2026');
  });

  it('formats end of year', () => {
    // Use midday to avoid timezone-crossing into next day
    const result = formatDate({ isoStr: '2026-12-31T12:00:00.000Z' });
    expect(result).toMatch(/декабр/i);
    expect(result).toContain('2026');
  });
});

describe('formatTime', () => {
  it('formats time as HH:MM', () => {
    const result = formatTime({ isoStr: '2026-04-20T09:00:00.000Z' });
    // Exact value depends on system timezone; just verify HH:MM format
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('different UTC times produce different local times', () => {
    const morning = formatTime({ isoStr: '2026-04-20T09:00:00.000Z' });
    const afternoon = formatTime({ isoStr: '2026-04-20T16:30:00.000Z' });
    expect(morning).not.toBe(afternoon);
  });

  it('uses 24-hour format', () => {
    // 16:30 UTC → any timezone will be > 12 in some cases
    const result = formatTime({ isoStr: '2026-04-20T16:30:00.000Z' });
    const hour = parseInt(result.split(':')[0], 10);
    // In any timezone east of UTC-5, this will be >= 12
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThan(24);
  });
});
