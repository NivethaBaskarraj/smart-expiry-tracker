const express = require('express');
const { checkExpiringSoon, checkExpired } = require('../utils/expiryChecker');

const router = express.Router();

function verifyCronSecret(req, res, next) {
  const configuredSecret = process.env.CRON_SECRET;

  // In production, require CRON_SECRET to be configured
  if (!configuredSecret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        message: 'CRON_SECRET is not configured on the server',
      });
    }
    // Allow local development testing without CRON_SECRET
    return next();
  }

  const incomingSecret =
    req.headers['x-cron-secret'] ||
    req.query.secret ||
    (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

  if (!incomingSecret || incomingSecret !== configuredSecret) {
    return res.status(401).json({ message: 'Unauthorized: Invalid cron secret' });
  }

  next();
}

async function handleExpiryCheck(req, res) {
  console.log('[Cron] Manual/external trigger received for expiry check');
  try {
    const expiringSoonResult = await checkExpiringSoon();
    const expiredResult = await checkExpired();

    res.json({
      success: true,
      expiringSoonProcessed: expiringSoonResult.count ?? 0,
      expiredProcessed: expiredResult.count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron] Error during triggered expiry check:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Support both POST and GET to accommodate various free external cron services (e.g. cron-job.org, EasyCron)
router.post('/check-expiry', verifyCronSecret, handleExpiryCheck);
router.get('/check-expiry', verifyCronSecret, handleExpiryCheck);

module.exports = router;
