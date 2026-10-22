const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // Password reset via email token
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    // Optional security question for password recovery
    securityQuestion: { type: String, default: null },
    securityAnswer: { type: String, default: null }, // hashed

    // Notification preferences
    notificationPreferences: {
      expiryAlertDays: { type: Number, default: 2, min: 1, max: 7 }, // Alert X days before expiry
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
      phoneNumber: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
