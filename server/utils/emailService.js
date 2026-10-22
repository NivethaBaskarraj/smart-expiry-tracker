const axios = require('axios');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (_e) {
  // nodemailer is optional if using HTTP providers
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const RESEND_API_URL = 'https://api.resend.com/emails';

function getProvider() {
  if (process.env.EMAIL_PROVIDER) {
    return process.env.EMAIL_PROVIDER.toLowerCase();
  }
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return 'smtp';
  return 'none';
}

function getSender() {
  const name = process.env.EMAIL_FROM_NAME || 'Smart Expiry Tracker';
  const email =
    process.env.BREVO_SENDER_EMAIL ||
    process.env.RESEND_SENDER_EMAIL ||
    process.env.EMAIL_USER ||
    'notifications@smartexpirytracker.local';
  return { name, email };
}

async function sendViaBrevo({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[Email] Brevo requested but BREVO_API_KEY is not set');
    return { success: false, reason: 'missing_api_key' };
  }
  const sender = getSender();
  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender,
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
        timeout: 10000,
      }
    );
    const messageId = response.data?.messageId || 'sent';
    console.log(`[Email:Brevo] Successfully sent to ${to} (messageId: ${messageId})`);
    return { success: true, messageId };
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error(`[Email:Brevo] Failed to send to ${to}:`, errorDetails);
    return { success: false, error: errorDetails };
  }
}

async function sendViaResend({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Resend requested but RESEND_API_KEY is not set');
    return { success: false, reason: 'missing_api_key' };
  }
  const sender = getSender();
  const from = `${sender.name} <${sender.email}>`;
  try {
    const response = await axios.post(
      RESEND_API_URL,
      {
        from,
        to: [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    const messageId = response.data?.id || 'sent';
    console.log(`[Email:Resend] Successfully sent to ${to} (id: ${messageId})`);
    return { success: true, messageId };
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error(`[Email:Resend] Failed to send to ${to}:`, errorDetails);
    return { success: false, error: errorDetails };
  }
}

async function sendViaSmtp({ to, subject, html }) {
  if (!nodemailer) {
    console.error('[Email:SMTP] nodemailer library is not installed');
    return { success: false, reason: 'nodemailer_missing' };
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email:SMTP] EMAIL_USER or EMAIL_PASS missing - skipping email send');
    return { success: false, reason: 'missing_credentials' };
  }

  const sender = getSender();
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email:SMTP] Successfully sent to ${to} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email:SMTP] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Universal email sender that routes to the configured provider.
 */
async function sendEmail({ to, subject, html }) {
  const provider = getProvider();

  switch (provider) {
    case 'brevo':
      return sendViaBrevo({ to, subject, html });
    case 'resend':
      return sendViaResend({ to, subject, html });
    case 'smtp':
      return sendViaSmtp({ to, subject, html });
    default:
      console.warn(
        `[Email] No valid provider configured (EMAIL_PROVIDER='${process.env.EMAIL_PROVIDER || ''}'). Skipping email to ${to}. Set BREVO_API_KEY, RESEND_API_KEY, or EMAIL_USER/EMAIL_PASS.`
      );
      return { success: false, reason: 'no_provider' };
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
        `<li style="margin-bottom: 6px;"><strong>${i.name}</strong> (${i.quantityValue || 1} ${
          i.quantityUnit || 'unit'
        }) — expiry: ${new Date(i.expiryDate).toLocaleDateString('en-US', {
          timeZone: 'UTC',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}</li>`
    )
    .join('');

  const bodyIntro = isExpiring
    ? `The following items in your Smart Expiry Tracker are about to expire within 2 days. Use them soon or check the app for recipe ideas!`
    : `The following items have passed their expiry date without being marked as used. Open the app to see suggested ways to dispose of or repurpose them.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 20px; color: #1e2a1e; border: 1px solid #e1e7e0; border-radius: 12px;">
      <h2 style="color: #2f9e44; margin-top: 0;">🥦 Smart Expiry Tracker</h2>
      <p style="font-size: 16px;">Hi ${userName || 'there'},</p>
      <p style="font-size: 15px; line-height: 1.5;">${bodyIntro}</p>
      <ul style="background: #f6f8f5; padding: 16px 24px; border-radius: 8px; font-size: 14px;">${listHtml}</ul>
      <p style="font-size: 13px; color: #666; margin-top: 24px;">— Smart Expiry Tracker</p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

async function sendPasswordResetEmail({ to, userName, resetLink }) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 20px; color: #1e2a1e; border: 1px solid #e1e7e0; border-radius: 12px;">
      <h2 style="color: #2f9e44; margin-top: 0;">🥦 Smart Expiry Tracker</h2>
      <p style="font-size: 16px;">Hi ${userName || 'there'},</p>
      <p style="font-size: 15px; line-height: 1.5;">We received a request to reset your Smart Expiry Tracker password. Click the button below to choose a new one. This link expires in 1 hour.</p>
      <p style="margin: 28px 0; text-align: center;">
        <a href="${resetLink}" style="background: #2f9e44; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
      <p style="font-size: 13px; color: #888; word-break: break-all; margin-top: 16px;">Or paste this link into your browser: <br>${resetLink}</p>
      <p style="font-size: 13px; color: #666; margin-top: 24px;">— Smart Expiry Tracker</p>
    </div>
  `;

  return sendEmail({ to, subject: '🔑 Reset your Smart Expiry Tracker password', html });
}

module.exports = {
  sendEmail,
  sendExpiryEmail,
  sendPasswordResetEmail,
};
