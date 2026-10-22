const axios = require('axios');

/**
 * Sends an SMS alert using Twilio HTTP API.
 * Feature-flagged behind ENABLE_SMS_ALERTS=true (default: false).
 */
async function sendSms({ to, message }) {
  const isEnabled = process.env.ENABLE_SMS_ALERTS === 'true';

  if (!isEnabled) {
    return { success: false, reason: 'sms_feature_flag_disabled' };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn(
      '[SMS] ENABLE_SMS_ALERTS is true but Twilio credentials are missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)'
    );
    return { success: false, reason: 'missing_credentials' };
  }

  if (!to) {
    return { success: false, reason: 'missing_recipient_number' };
  }

  try {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', fromNumber);
    params.append('Body', message);

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      params.toString(),
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    console.log(`[SMS] Sent message to ${to}, sid: ${response.data?.sid}`);
    return { success: true, sid: response.data?.sid };
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error(`[SMS] Failed to send SMS to ${to}:`, errorDetails);
    return { success: false, error: errorDetails };
  }
}

module.exports = {
  sendSms,
};
