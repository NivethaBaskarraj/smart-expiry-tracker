import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🥦 Smart Expiry Tracker</h1>
        <p className="subtitle">Reset your password</p>

        {error && <div className="error-banner">{error}</div>}

        {submitted ? (
          <>
            <div className="success-banner">
              If an account exists for that email, we've sent a password reset link. Check
              your inbox (and spam folder) — the link expires in 1 hour.
            </div>
            <p className="switch-link">
              <Link to="/login">Back to Log In</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="switch-link">
              Remembered it? <Link to="/login">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
