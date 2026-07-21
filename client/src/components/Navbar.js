import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar">
      <div className="navbar-brand">🥦 Smart Expiry Tracker</div>
      <div className="navbar-user">
        <span>Hi, {user?.name}</span>
        <button className="btn-ghost" onClick={logout}>
          Log Out
        </button>
      </div>
    </nav>
  );
}
