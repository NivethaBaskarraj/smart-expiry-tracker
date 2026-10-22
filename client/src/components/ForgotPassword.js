import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // 'email' or 'security-question'
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Security Question state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('find-question'); // 'find-question' or 'answer-question'
  const [sqSuccess, setSqSuccess] = useState(false);

  async function handleEmailSubmit(e) {
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

  async function handleFindQuestion(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/security-question', { params: { email } });
      setQuestion(res.data.question);
      setStep('answer-question');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No security question found for this account. Please use the email reset method instead.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswerSubmit(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-by-security-question', {
        email,
        answer,
        newPassword,
      });
      setSqSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect answer or failed reset');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🥦 Smart Expiry Tracker</h1>
        <p className="subtitle">Reset your account password</p>

        {/* Tab switch between Email Link and Security Question */}
        <div className="reset-mode-tabs" role="tablist">
          <button
            type="button"
            className={`tab-btn ${mode === 'email' ? 'active' : ''}`}
            onClick={() => {
              setMode('email');
              setError('');
            }}
          >
            📧 Email Link
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'security-question' ? 'active' : ''}`}
            onClick={() => {
              setMode('security-question');
              setError('');
            }}
          >
            🛡️ Security Question
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {mode === 'email' ? (
          submitted ? (
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
            <form onSubmit={handleEmailSubmit}>
              <label htmlFor="forgot-email">Email Address</label>
              <input
                id="forgot-email"
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
                Remembered your password? <Link to="/login">Log in</Link>
              </p>
            </form>
          )
        ) : sqSuccess ? (
          <div className="success-banner">
            Password reset successful! Redirecting to login...
          </div>
        ) : step === 'find-question' ? (
          <form onSubmit={handleFindQuestion}>
            <label htmlFor="sq-email">Enter your account email</label>
            <input
              id="sq-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Finding question...' : 'Next'}
            </button>
            <p className="switch-link">
              <Link to="/login">Back to Log In</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleAnswerSubmit}>
            <div className="security-question-prompt">
              <strong>Question: </strong> {question}
            </div>

            <label htmlFor="sq-answer">Your Answer</label>
            <input
              id="sq-answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              placeholder="Type your answer"
            />

            <label htmlFor="sq-new-pass">Choose New Password</label>
            <input
              id="sq-new-pass"
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <p className="switch-link">
              <button
                type="button"
                className="btn-ghost btn-small"
                onClick={() => setStep('find-question')}
                style={{ width: '100%', marginTop: '8px' }}
              >
                &larr; Try different email
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
