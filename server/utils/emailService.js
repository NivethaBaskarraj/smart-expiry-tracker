const { Resend } = require('resend');

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Resend's shared test sender - works without verifying your own domain.
// Once you verify a domain with Resend, you can swap this for something like
// "Smart Expiry Tracker <alerts@yourdomain.com>".
const FROM_ADDRESS = 'Smart Expiry Tracker <onboarding@resend.dev>';

async function sendExpiryEmail({ to, userName, items, type }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Email not configured (RESEND_API_KEY missing) - skipping email send');
    return;
  }

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

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Resend rejected the email:', JSON.stringify(error));
      return;
    }
    console.log(`Email sent to ${to} (${type}) - id: ${data?.id}`);
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}

async function sendPasswordResetEmail({ to, userName, resetLink }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Email not configured (RESEND_API_KEY missing) - skipping email send');
    return;
  }

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

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: '🔑 Reset your Smart Expiry Tracker password',
      html,
    });
    if (error) {
      console.error('Resend rejected the password reset email:', JSON.stringify(error));
      return;
    }
    console.log(`Password reset email sent to ${to} - id: ${data?.id}`);
  } catch (err) {
    console.error('Failed to send password reset email:', err.message);
  }
}

module.exports = { sendExpiryEmail, sendPasswordResetEmail };
