import React from 'react';

export default function ItemCardSkeleton() {
  return (
    <div className="item-card skeleton-card" aria-hidden="true">
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-meta"></div>
      <div className="skeleton-line skeleton-meta" style={{ width: '60%' }}></div>
      <div className="skeleton-line skeleton-badge"></div>
      <div className="item-actions">
        <div className="skeleton-btn"></div>
        <div className="skeleton-btn"></div>
      </div>
    </div>
  );
}
