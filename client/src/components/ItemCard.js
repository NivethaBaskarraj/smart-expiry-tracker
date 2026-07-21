import React, { useState } from 'react';
import api from '../api/axios';
import RecipeModal from './RecipeModal';
import DisposalModal from './DisposalModal';

const CATEGORY_LABELS = {
  produce: 'Fruits & Vegetables',
  dairy: 'Dairy',
  meat_seafood: 'Meat & Seafood',
  bakery: 'Bakery',
  pantry: 'Pantry / Grains',
  beverage: 'Beverages',
  other: 'Other',
};

export default function ItemCard({ item, onChanged }) {
  const [showRecipes, setShowRecipes] = useState(false);
  const [showDisposal, setShowDisposal] = useState(false);
  const [busy, setBusy] = useState(false);

  const isExpired = item.daysLeft < 0 && item.status === 'active';
  const isExpiringSoon = item.isExpiringSoon;

  let statusClass = 'status-ok';
  let statusLabel = `${item.daysLeft} day(s) left`;
  if (item.status === 'used') {
    statusClass = 'status-used';
    statusLabel = 'Used';
  } else if (isExpired) {
    statusClass = 'status-expired';
    statusLabel = `Expired ${Math.abs(item.daysLeft)} day(s) ago`;
  } else if (isExpiringSoon) {
    statusClass = 'status-soon';
    statusLabel = `Expiring soon — ${item.daysLeft} day(s) left`;
  }

  async function markUsed() {
    setBusy(true);
    try {
      await api.patch(`/items/${item._id}/used`);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem() {
    if (!window.confirm(`Delete "${item.name}" from your log?`)) return;
    setBusy(true);
    try {
      await api.delete(`/items/${item._id}`);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`item-card ${statusClass}`}>
      <div className="item-card-header">
        <h3>{item.name}</h3>
        <span className="category-tag">{CATEGORY_LABELS[item.category]}</span>
      </div>

      <p className="item-meta">Qty: {item.quantity}</p>
      <p className="item-meta">Expiry: {new Date(item.expiryDate).toDateString()}</p>
      <p className={`item-status ${statusClass}`}>{statusLabel}</p>

      <div className="item-actions">
        {item.status === 'active' && (
          <>
            <button className="btn-small" onClick={markUsed} disabled={busy}>
              ✅ Used
            </button>
            <button className="btn-small" onClick={() => setShowRecipes(true)}>
              🍳 Recipes
            </button>
          </>
        )}

        {isExpired && (
          <button className="btn-small btn-warn" onClick={() => setShowDisposal(true)}>
            ♻️ Disposal Tips
          </button>
        )}

        <button className="btn-small btn-danger" onClick={deleteItem} disabled={busy}>
          🗑️ Delete
        </button>
      </div>

      {showRecipes && <RecipeModal item={item} onClose={() => setShowRecipes(false)} />}
      {showDisposal && <DisposalModal item={item} onClose={() => setShowDisposal(false)} />}
    </div>
  );
}
