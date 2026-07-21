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

module.exports = { sendExpiryEmail };
