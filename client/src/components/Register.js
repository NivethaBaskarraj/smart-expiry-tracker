import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, loading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientError, setClientError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  async function handleSubmit(e) {
    e.preventDefault();
    setClientError('');

    if (password.length < 6) {
      setClientError('Password must be at least 6 characters');
      return;
    }

    const ok = await register(name.trim(), email.trim(), password);
    if (ok) navigate('/dashboard');
  }

  const activeError = clientError || error;

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>🥦 Smart Expiry Tracker</h1>
        <p className="subtitle">Create an account</p>

        {activeError && <div className="error-banner">{activeError}</div>}

        <label htmlFor="register-name">Name</label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Alex"
          autoComplete="name"
        />

        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          autoComplete="email"
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          maxLength={128}
          required
          autoComplete="new-password"
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <p className="switch-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
