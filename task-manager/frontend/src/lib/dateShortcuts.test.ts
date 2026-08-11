import { describe, expect, it } from 'vitest';
import { computeNextWeek, computeToday, computeTomorrow } from './dateShortcuts';

describe('dateShortcuts', () => {
  const fixedNow = new Date('2026-03-15T14:30:00.000Z');

  it('computeToday returns start of the given day', () => {
    const result = new Date(computeToday(fixedNow));
    expect(result.getHours()).toBe(0);
    expect(result.getDate()).toBe(fixedNow.getDate());
  });

  it('computeTomorrow returns one day after today', () => {
    const today = new Date(computeToday(fixedNow));
    const tomorrow = new Date(computeTomorrow(fixedNow));
    expect(tomorrow.getTime() - today.getTime()).toBe(86_400_000);
  });

  it('computeNextWeek returns seven days after today', () => {
    const today = new Date(computeToday(fixedNow));
    const nextWeek = new Date(computeNextWeek(fixedNow));
    expect(nextWeek.getTime() - today.getTime()).toBe(7 * 86_400_000);
  });
});
