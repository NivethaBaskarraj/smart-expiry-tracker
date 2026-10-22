const {
  toUtcStartOfDay,
  toUtcEndOfDay,
  getDaysDifference,
  computeItemStatus,
} = require('../utils/dateUtils');

describe('Date & Expiry Calculation Utilities', () => {
  const mockNow = new Date('2026-10-22T14:30:00.000Z');

  test('toUtcStartOfDay normalizes a date to 00:00:00.000Z', () => {
    const normalized = toUtcStartOfDay('2026-10-25T18:45:00.000Z');
    expect(normalized.toISOString()).toBe('2026-10-25T00:00:00.000Z');
  });

  test('toUtcEndOfDay normalizes a date to 23:59:59.999Z', () => {
    const normalized = toUtcEndOfDay('2026-10-25T02:00:00.000Z');
    expect(normalized.toISOString()).toBe('2026-10-25T23:59:59.999Z');
  });

  test('getDaysDifference returns 0 for items expiring on current calendar date', () => {
    const diff = getDaysDifference('2026-10-22', mockNow);
    expect(diff).toBe(0);
  });

  test('getDaysDifference returns positive number for future dates', () => {
    const diffTomorrow = getDaysDifference('2026-10-23', mockNow);
    expect(diffTomorrow).toBe(1);

    const diffIn3Days = getDaysDifference('2026-10-25', mockNow);
    expect(diffIn3Days).toBe(3);
  });

  test('getDaysDifference returns negative number for past dates', () => {
    const diffYesterday = getDaysDifference('2026-10-21', mockNow);
    expect(diffYesterday).toBe(-1);

    const diff3DaysAgo = getDaysDifference('2026-10-19', mockNow);
    expect(diff3DaysAgo).toBe(-3);
  });

  test('computeItemStatus marks item expiring today as expiring soon, NOT expired', () => {
    const item = { expiryDate: '2026-10-22', status: 'active' };
    const result = computeItemStatus(item, mockNow);
    expect(result.daysLeft).toBe(0);
    expect(result.isExpired).toBe(false);
    expect(result.isExpiringSoon).toBe(true);
    expect(result.statusLabel).toBe('Expires today');
  });

  test('computeItemStatus marks item expiring yesterday as expired', () => {
    const item = { expiryDate: '2026-10-21', status: 'active' };
    const result = computeItemStatus(item, mockNow);
    expect(result.daysLeft).toBe(-1);
    expect(result.isExpired).toBe(true);
    expect(result.isExpiringSoon).toBe(false);
    expect(result.statusLabel).toBe('Expired 1 day(s) ago');
  });

  test('computeItemStatus marks used items correctly without expired status', () => {
    const item = { expiryDate: '2026-10-15', status: 'used' };
    const result = computeItemStatus(item, mockNow);
    expect(result.isExpired).toBe(false);
    expect(result.isExpiringSoon).toBe(false);
    expect(result.statusLabel).toBe('Used');
  });
});
