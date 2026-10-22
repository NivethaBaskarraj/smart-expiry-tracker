/**
 * Date utilities for grocery expiry calculations.
 * Groceries expire on a calendar day, so calculations must be normalized
 * to UTC start-of-day to avoid premature expirations at midday and timezone shifts.
 */

function toUtcStartOfDay(dateInput) {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function toUtcEndOfDay(dateInput) {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/**
 * Calculates calendar days between two dates.
 * Positive number = days until expiry.
 * 0 = expires today.
 * Negative number = expired X days ago.
 */
function getDaysDifference(expiryDate, fromDate = new Date()) {
  const exp = toUtcStartOfDay(expiryDate);
  const from = toUtcStartOfDay(fromDate);
  if (!exp || !from) return 0;

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((exp.getTime() - from.getTime()) / msPerDay);
}

/**
 * Computes live status details for an item.
 */
function computeItemStatus(item, referenceDate = new Date()) {
  const daysLeft = getDaysDifference(item.expiryDate, referenceDate);
  const isUsed = item.status === 'used';
  const isExpired = !isUsed && (item.status === 'expired' || daysLeft < 0);
  const isExpiringSoon = !isUsed && !isExpired && daysLeft <= 2;

  let statusLabel;
  if (isUsed) {
    statusLabel = 'Used';
  } else if (isExpired) {
    const daysAgo = Math.abs(daysLeft);
    statusLabel = daysAgo === 0 ? 'Expired today' : `Expired ${daysAgo} day(s) ago`;
  } else if (daysLeft === 0) {
    statusLabel = 'Expires today';
  } else if (daysLeft === 1) {
    statusLabel = '1 day left';
  } else if (isExpiringSoon) {
    statusLabel = `${daysLeft} days left`;
  } else {
    statusLabel = `${daysLeft} days left`;
  }

  return {
    daysLeft,
    isExpired,
    isExpiringSoon,
    statusLabel,
  };
}

module.exports = {
  toUtcStartOfDay,
  toUtcEndOfDay,
  getDaysDifference,
  computeItemStatus,
};
