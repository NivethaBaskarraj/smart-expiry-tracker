import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from './Navbar';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile data
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [alertDays, setAlertDays] = useState(2);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsEnabledOnServer, setSmsEnabledOnServer] = useState(false);

  // Security Question
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [hasExistingQuestion, setHasExistingQuestion] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get('/auth/profile');
        const data = res.data;
        setName(data.name || '');
        setEmail(data.email || '');
        if (data.notificationPreferences) {
          setAlertDays(data.notificationPreferences.expiryAlertDays ?? 2);
          setEmailAlerts(data.notificationPreferences.emailAlerts !== false);
          setSmsAlerts(Boolean(data.notificationPreferences.smsAlerts));
          setPhoneNumber(data.notificationPreferences.phoneNumber || '');
        }
        setSecurityQuestion(data.securityQuestion || '');
        setHasExistingQuestion(data.hasSecurityQuestion);
        setSmsEnabledOnServer(Boolean(data.smsEnabledOnServer));
      } catch (err) {
        showToast({ message: 'Could not load profile details', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [showToast]);

  async function handleSavePreferences(e) {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await api.put('/auth/profile', {
        name,
        notificationPreferences: {
          expiryAlertDays: Number(alertDays),
          emailAlerts,
          smsAlerts,
          phoneNumber,
        },
      });
      setUser((prev) => ({ ...prev, name: res.data.user.name }));
      showToast({ message: 'Notification preferences saved!', type: 'success' });
    } catch (err) {
      showToast({ message: err.response?.data?.message || 'Failed to save preferences', type: 'error' });
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleSaveSecurityQuestion(e) {
    e.preventDefault();
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      showToast({ message: 'Please provide both question and answer', type: 'warning' });
      return;
    }
    setSavingSecurity(true);
    try {
      await api.put('/auth/profile', {
        securityQuestion,
        securityAnswer,
      });
      setHasExistingQuestion(true);
      setSecurityAnswer('');
      showToast({ message: 'Security question updated successfully!', type: 'success' });
    } catch (err) {
      showToast({ message: err.response?.data?.message || 'Failed to save security question', type: 'error' });
    } finally {
      setSavingSecurity(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast({ message: 'New passwords do not match', type: 'warning' });
      return;
    }
    if (newPassword.length < 6) {
      showToast({ message: 'New password must be at least 6 characters', type: 'warning' });
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({ message: 'Password changed successfully!', type: 'success' });
    } catch (err) {
      showToast({ message: err.response?.data?.message || 'Failed to change password', type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="app-layout">
      <Navbar />

      <main className="home-container">
        <div className="home-header">
          <div>
            <h1>Account Settings</h1>
            <p className="home-subheading">Manage your profile, alerts, and security options.</p>
          </div>
          <Link to="/dashboard" className="btn-ghost">
            &larr; Back to Groceries
          </Link>
        </div>

        {loading ? (
          <div className="modal-loading-box">
            <span className="spinner" aria-hidden="true"></span>
            <p>Loading your profile...</p>
          </div>
        ) : (
          <div className="profile-grid">
            {/* Card 1: Profile & Notification Preferences */}
            <section className="profile-card">
              <h2>🔔 Notification Preferences</h2>
              <form onSubmit={handleSavePreferences}>
                <label htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <label htmlFor="profile-email">Email Address</label>
                <input id="profile-email" type="email" value={email} disabled />

                <label htmlFor="profile-alert-days">Alert Me Before Expiry</label>
                <select
                  id="profile-alert-days"
                  value={alertDays}
                  onChange={(e) => setAlertDays(e.target.value)}
                >
                  <option value="1">1 day before expiry</option>
                  <option value="2">2 days before expiry (default)</option>
                  <option value="3">3 days before expiry</option>
                  <option value="5">5 days before expiry</option>
                  <option value="7">1 week before expiry</option>
                </select>

                <div className="checkbox-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                    />
                    <span>Receive daily email reminders for expiring & expired groceries</span>
                  </label>
                </div>

                <div className="sms-section">
                  <div className="sms-header">
                    <span className="sms-title">📱 SMS Alerts (Twilio)</span>
                    <span className={`status-badge ${smsEnabledOnServer ? 'badge-ok' : 'badge-disabled'}`}>
                      {smsEnabledOnServer ? 'Enabled on Server' : 'Feature Flag Off'}
                    </span>
                  </div>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      disabled={!smsEnabledOnServer}
                    />
                    <span>Send SMS text alert when items are expiring soon</span>
                  </label>

                  <label htmlFor="profile-phone" style={{ marginTop: '10px' }}>
                    Mobile Phone Number (E.164 e.g. +1234567890)
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={!smsEnabledOnServer && !smsAlerts}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={savingPrefs}>
                  {savingPrefs ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            </section>

            {/* Card 2: Security Question Reset */}
            <section className="profile-card">
              <h2>🛡️ Security Question Recovery</h2>
              <p className="card-desc">
                Set a security question to allow password reset even without access to your email.
              </p>

              {hasExistingQuestion && (
                <div className="security-status-tag">
                  ✅ You have an active security question configured.
                </div>
              )}

              <form onSubmit={handleSaveSecurityQuestion}>
                <label htmlFor="profile-question">Security Question</label>
                <input
                  id="profile-question"
                  type="text"
                  placeholder="e.g. What was the name of your first school or pet?"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  required
                />

                <label htmlFor="profile-answer">Your Secret Answer</label>
                <input
                  id="profile-answer"
                  type="text"
                  placeholder="Type your secret answer here..."
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  required
                />

                <button type="submit" className="btn-primary" disabled={savingSecurity}>
                  {savingSecurity ? 'Updating...' : hasExistingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </form>
            </section>

            {/* Card 3: Change Password */}
            <section className="profile-card">
              <h2>🔑 Change Password</h2>
              <form onSubmit={handleChangePassword}>
                <label htmlFor="profile-current-pass">Current Password</label>
                <input
                  id="profile-current-pass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />

                <label htmlFor="profile-new-pass">New Password</label>
                <input
                  id="profile-new-pass"
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <label htmlFor="profile-confirm-pass">Confirm New Password</label>
                <input
                  id="profile-confirm-pass"
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <button type="submit" className="btn-primary" disabled={savingPassword}>
                  {savingPassword ? 'Updating Password...' : 'Change Password'}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
