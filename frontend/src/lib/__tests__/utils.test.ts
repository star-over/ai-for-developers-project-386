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
  it('formats a regular date', () => {
    expect(formatDate({ isoStr: '2026-04-20T09:00:00.000Z' })).toBe('20 апреля 2026 г.');
  });

  it('formats start of year', () => {
    expect(formatDate({ isoStr: '2026-01-01T00:00:00.000Z' })).toBe('1 января 2026 г.');
  });

  it('formats end of year', () => {
    expect(formatDate({ isoStr: '2026-12-31T23:59:59.000Z' })).toBe('31 декабря 2026 г.');
  });
});

describe('formatTime', () => {
  it('formats morning time', () => {
    expect(formatTime({ isoStr: '2026-04-20T09:00:00.000Z' })).toBe('09:00');
  });

  it('formats afternoon time', () => {
    expect(formatTime({ isoStr: '2026-04-20T16:30:00.000Z' })).toBe('16:30');
  });

  it('formats midnight', () => {
    expect(formatTime({ isoStr: '2026-04-20T00:00:00.000Z' })).toBe('00:00');
  });
});
