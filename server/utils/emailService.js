const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendExpiryEmail({ to, userName, items, type }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email not configured (EMAIL_USER/EMAIL_PASS missing) - skipping email send');
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

  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: `"Smart Expiry Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to} (${type})`);
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}

async function sendPasswordResetEmail({ to, userName, resetLink }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email not configured (EMAIL_USER/EMAIL_PASS missing) - skipping email send');
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

  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: `"Smart Expiry Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🔑 Reset your Smart Expiry Tracker password',
      html,
    });
    console.log(`Password reset email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send password reset email:', err.message);
  }
}

module.exports = { sendExpiryEmail, sendPasswordResetEmail };
