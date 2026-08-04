const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// This must be an email address you have verified as a "Sender" in your
// Brevo account (Settings -> Senders, Domains & Dedicated IPs -> Senders).
// Once verified, you can send to ANY recipient, unlike Resend's domain-only rule.
const SENDER = {
  name: 'Smart Expiry Tracker',
  email: process.env.BREVO_SENDER_EMAIL,
};

async function sendViaBrevo({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.warn(
      'Email not configured (BREVO_API_KEY or BREVO_SENDER_EMAIL missing) - skipping email send'
    );
    return;
  }

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: SENDER,
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    console.log(`Email sent to ${to} - messageId: ${response.data?.messageId}`);
  } catch (err) {
    console.error(
      'Failed to send email via Brevo:',
      err.response?.data ? JSON.stringify(err.response.data) : err.message
    );
  }
}

async function sendExpiryEmail({ to, userName, items, type }) {
  const isExpiring = type === 'expiring';
  const subject = isExpiring
    ? `⏰ ${items.length} item(s) expiring soon - Smart Expiry Tracker`
    : `⚠️ ${items.length} item(s) expired - Smart Expiry Tracker`;

  const listHtml = items
    .map(
      (i) =>
        `<li><strong>${i.name}</strong> — expiry date: ${new Date(i.expiryDate).toDateString()}</li>`
    )
    .join('');

  const bodyIntro = isExpiring
    ? `The following items in your Smart Expiry Tracker are about to expire within 2 days. Use them soon or check the app for recipe ideas!`
    : `The following items have passed their expiry date without being marked as used. Open the app to see suggested ways to dispose of or repurpose them.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px;">
      <h2>Hi ${userName},</h2>
      <p>${bodyIntro}</p>
      <ul>${listHtml}</ul>
      <p>— Smart Expiry Tracker</p>
    </div>
  `;

  await sendViaBrevo({ to, subject, html });
}

async function sendPasswordResetEmail({ to, userName, resetLink }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px;">
      <h2>Hi ${userName},</h2>
      <p>We received a request to reset your Smart Expiry Tracker password. Click the button below to choose a new one. This link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="background:#2f9e44;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
      </p>
      <p>If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
      <p>— Smart Expiry Tracker</p>
    </div>
  `;

  await sendViaBrevo({ to, subject: '🔑 Reset your Smart Expiry Tracker password', html });
}

module.exports = { sendExpiryEmail, sendPasswordResetEmail };
