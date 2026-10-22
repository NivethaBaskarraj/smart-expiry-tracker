const cron = require('node-cron');
const Item = require('../models/Item');
const User = require('../models/User');
const { sendExpiryEmail } = require('./emailService');
const { sendSms } = require('./smsService');
const { toUtcStartOfDay, toUtcEndOfDay, getDaysDifference } = require('./dateUtils');

async function checkExpiringSoon() {
  try {
    const now = new Date();
    const todayStart = toUtcStartOfDay(now);
    // Find active items expiring within the maximum window (up to 7 days)
    const maxWindowEnd = toUtcEndOfDay(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

    const candidateItems = await Item.find({
      status: 'active',
      expiryDate: { $gte: todayStart, $lte: maxWindowEnd },
      expiringSoonNotified: false,
    });

    if (candidateItems.length === 0) return { count: 0 };

    const byUser = groupByUser(candidateItems);
    let processedCount = 0;

    for (const [userId, userItems] of Object.entries(byUser)) {
      const user = await User.findById(userId);
      if (!user) continue;

      const alertThresholdDays = user.notificationPreferences?.expiryAlertDays ?? 2;
      const shouldSendEmail = user.notificationPreferences?.emailAlerts !== false;
      const shouldSendSms = Boolean(user.notificationPreferences?.smsAlerts && user.notificationPreferences?.phoneNumber);

      // Filter items matching this user's specific alert threshold
      const qualifyingItems = userItems.filter((item) => {
        const daysLeft = getDaysDifference(item.expiryDate, now);
        return daysLeft >= 0 && daysLeft <= alertThresholdDays;
      });

      if (qualifyingItems.length === 0) continue;

      if (shouldSendEmail && user.email) {
        await sendExpiryEmail({
          to: user.email,
          userName: user.name,
          items: qualifyingItems,
          type: 'expiring',
        });
      }

      if (shouldSendSms) {
        const summaryMsg = `Smart Expiry Tracker: You have ${qualifyingItems.length} item(s) expiring soon (${qualifyingItems
          .map((i) => i.name)
          .slice(0, 3)
          .join(', ')}). Check the app!`;
        await sendSms({ to: user.notificationPreferences.phoneNumber, message: summaryMsg });
      }

      // Mark items notified
      await Item.updateMany(
        { _id: { $in: qualifyingItems.map((i) => i._id) } },
        { expiringSoonNotified: true }
      );
      processedCount += qualifyingItems.length;
    }

    return { count: processedCount };
  } catch (err) {
    console.error('Error during checkExpiringSoon:', err.message);
    return { count: 0, error: err.message };
  }
}

async function checkExpired() {
  try {
    const now = new Date();
    const todayStart = toUtcStartOfDay(now);

    // Items strictly before today's calendar date that were never marked used and not yet notified
    const items = await Item.find({
      status: 'active',
      expiryDate: { $lt: todayStart },
      expiredNotified: false,
    });

    if (items.length === 0) return { count: 0 };

    const byUser = groupByUser(items);
    let processedCount = 0;

    for (const [userId, userItems] of Object.entries(byUser)) {
      const user = await User.findById(userId);
      if (!user) continue;

      const shouldSendEmail = user.notificationPreferences?.emailAlerts !== false;
      if (shouldSendEmail && user.email) {
        await sendExpiryEmail({
          to: user.email,
          userName: user.name,
          items: userItems,
          type: 'expired',
        });
      }

      await Item.updateMany(
        { _id: { $in: userItems.map((i) => i._id) } },
        { status: 'expired', expiredNotified: true }
      );
      processedCount += userItems.length;
    }

    return { count: processedCount };
  } catch (err) {
    console.error('Error during checkExpired:', err.message);
    return { count: 0, error: err.message };
  }
}

function groupByUser(items) {
  return items.reduce((acc, item) => {
    const key = item.user.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function startExpiryChecker() {
  // Runs once every day at 8:00 AM server time
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily expiry check at 8:00 AM...');
    await checkExpiringSoon();
    await checkExpired();
  });

  console.log('[Cron] Expiry checker cron job scheduled (daily at 8:00 AM)');
}

module.exports = { startExpiryChecker, checkExpiringSoon, checkExpired };
