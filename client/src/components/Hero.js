import React from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <div className="hero-page">
      <nav className="hero-nav">
        <div className="hero-brand">🥦 Smart Expiry Tracker</div>
        <div className="hero-nav-actions">
          <Link to="/login" className="btn-ghost-light">Log In</Link>
          <Link to="/register" className="btn-light">Sign Up</Link>
        </div>
      </nav>

      <div className="hero-content">
        <div className="hero-text">
          <h1>
            Never let your groceries <span className="hero-highlight">go to waste</span> again
          </h1>
          <p>
            Track expiry dates, get recipe ideas before food goes bad, and learn smart ways
            to reuse or dispose of what you couldn't finish in time.
          </p>
          <div className="hero-cta-group">
            <Link to="/register" className="btn-light large">Get Started Free</Link>
            <Link to="/login" className="btn-ghost-light large">I already have an account</Link>
          </div>
        </div>

        <div className="hero-illustration" aria-hidden="true">
          <svg viewBox="0 0 400 400" className="hero-svg">
            <circle cx="200" cy="200" r="160" className="hero-blob" />
            <g className="float-slow">
              <text x="90" y="140" fontSize="64">🥑</text>
            </g>
            <g className="float-medium">
              <text x="230" y="110" fontSize="56">🍌</text>
            </g>
            <g className="float-fast">
              <text x="250" y="240" fontSize="60">🥛</text>
            </g>
            <g className="float-medium">
              <text x="110" y="270" fontSize="52">🥕</text>
            </g>
            <g className="float-slow">
              <text x="180" y="320" fontSize="48">🍅</text>
            </g>
          </svg>
        </div>
      </div>

      <div className="hero-features">
        <div className="hero-feature-card">
          <div className="hero-feature-icon">⏰</div>
          <h3>Never forget expiry dates</h3>
          <p>Add items once and get notified before they go bad — no more surprise spoilage.</p>
        </div>
        <div className="hero-feature-card">
          <div className="hero-feature-icon">🍳</div>
          <h3>Recipe ideas on demand</h3>
          <p>Get real recipe suggestions built around ingredients that need to be used soon.</p>
        </div>
        <div className="hero-feature-card">
          <div className="hero-feature-icon">♻️</div>
          <h3>Smart disposal tips</h3>
          <p>Learn how to compost, repurpose, or reuse items that slipped past their date.</p>
        </div>
      </div>
    </div>
  );
}
