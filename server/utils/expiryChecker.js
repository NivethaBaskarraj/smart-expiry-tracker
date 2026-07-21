const cron = require('node-cron');
const Item = require('../models/Item');
const User = require('../models/User');
const { sendExpiryEmail } = require('./emailService');

async function checkExpiringSoon() {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // active items expiring within the next 2 days that haven't been emailed yet
  const items = await Item.find({
    status: 'active',
    expiryDate: { $gte: now, $lte: twoDaysFromNow },
    expiringSoonNotified: false,
  });

  const byUser = groupByUser(items);
  for (const [userId, userItems] of Object.entries(byUser)) {
    const user = await User.findById(userId);
    if (!user) continue;
    await sendExpiryEmail({ to: user.email, userName: user.name, items: userItems, type: 'expiring' });
    await Item.updateMany(
      { _id: { $in: userItems.map((i) => i._id) } },
      { expiringSoonNotified: true }
    );
  }
}

async function checkExpired() {
  const now = new Date();

  // items that passed expiry, still marked active (never used), not yet emailed about expiring
  const items = await Item.find({
    status: 'active',
    expiryDate: { $lt: now },
    expiredNotified: false,
  });

  const byUser = groupByUser(items);
  for (const [userId, userItems] of Object.entries(byUser)) {
    const user = await User.findById(userId);
    if (!user) continue;
    await sendExpiryEmail({ to: user.email, userName: user.name, items: userItems, type: 'expired' });
    await Item.updateMany(
      { _id: { $in: userItems.map((i) => i._id) } },
      { status: 'expired', expiredNotified: true }
    );
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
    console.log('Running daily expiry check...');
    try {
      await checkExpiringSoon();
      await checkExpired();
    } catch (err) {
      console.error('Expiry checker error:', err.message);
    }
  });

  // Also run once on server startup so testing doesn't require waiting until 8 AM
  checkExpiringSoon().catch((e) => console.error(e.message));
  checkExpired().catch((e) => console.error(e.message));

  console.log('Expiry checker cron job scheduled (daily at 8:00 AM)');
}

module.exports = { startExpiryChecker, checkExpiringSoon, checkExpired };
