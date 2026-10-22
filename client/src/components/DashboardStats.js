import React from 'react';

export default function DashboardStats({ items, currentFilter, onSelectFilter }) {
  const expiringSoonCount = items.filter(
    (i) => i.isExpiringSoon && i.status !== 'used'
  ).length;

  const expiredCount = items.filter(
    (i) => i.status === 'expired' || (i.status !== 'used' && i.daysLeft < 0)
  ).length;

  const activeGoodCount = items.filter(
    (i) => i.status === 'active' && !i.isExpiringSoon && i.daysLeft > 2
  ).length;

  const usedCount = items.filter((i) => i.status === 'used').length;

  return (
    <div className="dashboard-stats" role="region" aria-label="Inventory overview">
      <button
        type="button"
        className={`stat-card stat-soon ${currentFilter === 'expiring' ? 'selected' : ''}`}
        onClick={() => onSelectFilter('expiring')}
      >
        <span className="stat-icon">⏰</span>
        <div className="stat-content">
          <span className="stat-number">{expiringSoonCount}</span>
          <span className="stat-label">Expiring Soon</span>
        </div>
      </button>

      <button
        type="button"
        className={`stat-card stat-expired ${currentFilter === 'expired' ? 'selected' : ''}`}
        onClick={() => onSelectFilter('expired')}
      >
        <span className="stat-icon">⚠️</span>
        <div className="stat-content">
          <span className="stat-number">{expiredCount}</span>
          <span className="stat-label">Expired</span>
        </div>
      </button>

      <button
        type="button"
        className={`stat-card stat-good ${currentFilter === 'active' ? 'selected' : ''}`}
        onClick={() => onSelectFilter('active')}
      >
        <span className="stat-icon">🍏</span>
        <div className="stat-content">
          <span className="stat-number">{activeGoodCount}</span>
          <span className="stat-label">Fresh & Good</span>
        </div>
      </button>

      <button
        type="button"
        className={`stat-card stat-used ${currentFilter === 'used' ? 'selected' : ''}`}
        onClick={() => onSelectFilter('used')}
      >
        <span className="stat-icon">✅</span>
        <div className="stat-content">
          <span className="stat-number">{usedCount}</span>
          <span className="stat-label">Used / Saved</span>
        </div>
      </button>
    </div>
  );
}
