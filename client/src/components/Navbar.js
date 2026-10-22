import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar" aria-label="Main Navigation">
      <Link to="/dashboard" className="navbar-brand-link">
        <span className="navbar-brand">🥦 Smart Expiry Tracker</span>
      </Link>
      <div className="navbar-user">
        <span className="user-greeting">Hi, {user?.name || 'there'}</span>
        <Link to="/profile" className="btn-ghost btn-small" aria-label="Account Settings and Profile">
          ⚙️ Settings
        </Link>
        <button className="btn-ghost btn-small" onClick={logout} aria-label="Log out of account">
          Log Out
        </button>
      </div>
    </nav>
  );
}
