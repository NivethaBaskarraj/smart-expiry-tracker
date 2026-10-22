const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function getClientBaseUrl() {
  const raw = process.env.CLIENT_URL || 'http://localhost:3000';
  const firstUrl = raw.split(',')[0].trim();
  return firstUrl.replace(/\/+$/, '');
}

// @route  POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: 'Password cannot exceed 128 characters' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim().slice(0, 100);

    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route  POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route  GET /api/auth/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      notificationPreferences: user.notificationPreferences || {
        expiryAlertDays: 2,
        emailAlerts: true,
        smsAlerts: false,
        phoneNumber: '',
      },
      hasSecurityQuestion: Boolean(user.securityQuestion && user.securityAnswer),
      securityQuestion: user.securityQuestion || '',
      smsEnabledOnServer: process.env.ENABLE_SMS_ALERTS === 'true',
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// @route  PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, notificationPreferences, securityQuestion, securityAnswer } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim().slice(0, 100);
    }

    if (notificationPreferences && typeof notificationPreferences === 'object') {
      const { expiryAlertDays, emailAlerts, smsAlerts, phoneNumber } = notificationPreferences;
      if (expiryAlertDays !== undefined) {
        const days = Number(expiryAlertDays);
        if (!Number.isNaN(days) && days >= 1 && days <= 7) {
          user.notificationPreferences.expiryAlertDays = days;
        }
      }
      if (emailAlerts !== undefined) {
        user.notificationPreferences.emailAlerts = Boolean(emailAlerts);
      }
      if (smsAlerts !== undefined) {
        user.notificationPreferences.smsAlerts = Boolean(smsAlerts);
      }
      if (phoneNumber !== undefined) {
        user.notificationPreferences.phoneNumber = typeof phoneNumber === 'string' ? phoneNumber.trim() : null;
      }
    }

    // Set or update security question if provided
    if (securityQuestion && securityAnswer) {
      if (typeof securityQuestion === 'string' && typeof securityAnswer === 'string') {
        const trimmedQ = securityQuestion.trim();
        const trimmedA = securityAnswer.trim().toLowerCase();
        if (trimmedQ.length >= 3 && trimmedA.length >= 2) {
          user.securityQuestion = trimmedQ;
          const salt = await bcrypt.genSalt(10);
          user.securityAnswer = await bcrypt.hash(trimmedA, salt);
        }
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        notificationPreferences: user.notificationPreferences,
        hasSecurityQuestion: Boolean(user.securityQuestion && user.securityAnswer),
        securityQuestion: user.securityQuestion || '',
      },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route  PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({ message: 'New password must be between 6 and 128 characters' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// @route  GET /api/auth/security-question?email=...
// Fetches the user's security question without disclosing any password details
router.get('/security-question', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.securityQuestion) {
      return res.status(404).json({
        message: 'No security question is configured for this account. Please use the email reset link instead.',
      });
    }

    res.json({ question: user.securityQuestion });
  } catch (err) {
    console.error('Security question query error:', err);
    res.status(500).json({ message: 'Server error fetching security question' });
  }
});

// @route  POST /api/auth/reset-by-security-question
router.post('/reset-by-security-question', passwordResetLimiter, async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email || !answer || !newPassword) {
      return res.status(400).json({ message: 'Email, answer, and new password are required' });
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({ message: 'New password must be between 6 and 128 characters' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.securityAnswer) {
      return res.status(400).json({ message: 'Invalid email or security answer' });
    }

    const isMatch = await bcrypt.compare(answer.trim().toLowerCase(), user.securityAnswer);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect security answer' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password reset successful! You can now log in.' });
  } catch (err) {
    console.error('Security question reset error:', err);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

// @route  POST /api/auth/forgot-password
// Always responds with a generic success message to prevent user enumeration.
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      const resetLink = `${getClientBaseUrl()}/reset-password/${rawToken}`;
      await sendPasswordResetEmail({ to: user.email, userName: user.name, resetLink });
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot-password error:', err);
    res.status(500).json({ message: 'Server error processing password reset request' });
  }
});

// @route  POST /api/auth/reset-password/:token
router.post('/reset-password/:token', passwordResetLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: 'Password cannot exceed 128 characters' });
    }

    if (!req.params.token || req.params.token.length !== 64) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

module.exports = router;
