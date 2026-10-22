import React, { useState } from 'react';
import api from '../api/axios';
import RecipeModal from './RecipeModal';
import DisposalModal from './DisposalModal';
import EditItemForm from './EditItemForm';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../context/ToastContext';
import { formatExpiryDate } from '../utils/dateUtils';

const CATEGORY_LABELS = {
  produce: 'Fruits & Vegetables',
  dairy: 'Dairy',
  meat_seafood: 'Meat & Seafood',
  bakery: 'Bakery',
  pantry: 'Pantry / Grains',
  beverage: 'Beverages',
  other: 'Other',
};

const UNIT_LABELS = {
  unit: 'unit(s)',
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  litre: 'litre',
};

export default function ItemCard({ item, onChanged }) {
  const { showToast } = useToast();
  const [showRecipes, setShowRecipes] = useState(false);
  const [showDisposal, setShowDisposal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const isUsed = item.status === 'used';
  const isExpired = !isUsed && (item.status === 'expired' || item.daysLeft < 0);
  const isExpiringSoon = !isUsed && !isExpired && item.daysLeft <= 2;

  let statusClass = 'status-ok';
  let statusLabel = `${item.daysLeft} day(s) left`;

  if (isUsed) {
    statusClass = 'status-used';
    statusLabel = 'Used';
  } else if (isExpired) {
    statusClass = 'status-expired';
    const daysAgo = Math.abs(item.daysLeft);
    statusLabel = daysAgo === 0 ? 'Expired today' : `Expired ${daysAgo} day(s) ago`;
  } else if (item.daysLeft === 0) {
    statusClass = 'status-soon';
    statusLabel = 'Expires today';
  } else if (isExpiringSoon) {
    statusClass = 'status-soon';
    statusLabel = `Expiring soon — ${item.daysLeft} day(s) left`;
  }

  // Handle legacy string quantity or numeric quantityValue
  const displayQuantity =
    item.quantityValue !== undefined && item.quantityValue !== null
      ? `${item.quantityValue} ${UNIT_LABELS[item.quantityUnit] || item.quantityUnit || 'unit(s)'}`
      : item.quantity || '1 unit(s)';

  async function markUsed() {
    setBusy(true);
    try {
      await api.patch(`/items/${item._id}/used`);
      showToast({ message: `Marked "${item.name}" as used! Great job reducing waste!`, type: 'success' });
      onChanged();
    } catch (err) {
      showToast({ message: err.response?.data?.message || 'Could not update item', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    setShowDeleteConfirm(false);
    setBusy(true);
    try {
      await api.delete(`/items/${item._id}`);
      showToast({ message: `"${item.name}" deleted from your inventory`, type: 'info' });
      onChanged();
    } catch (err) {
      showToast({ message: err.response?.data?.message || 'Could not delete item', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`item-card ${statusClass}`} aria-label={`${item.name} (${statusLabel})`}>
      <div className="item-card-header">
        <h3>{item.name}</h3>
        <span className="category-tag">{CATEGORY_LABELS[item.category] || item.category}</span>
      </div>

      <p className="item-meta">
        <strong>Qty:</strong> {displayQuantity}
      </p>
      <p className="item-meta">
        <strong>Expiry:</strong> {formatExpiryDate(item.expiryDate)}
      </p>
      <p className={`item-status ${statusClass}`}>{statusLabel}</p>

      <div className="item-actions">
        {!isUsed && (
          <button
            type="button"
            className="btn-small"
            onClick={markUsed}
            disabled={busy}
            aria-label={`Mark ${item.name} as used`}
          >
            ✅ Used
          </button>
        )}

        {!isUsed && !isExpired && (
          <button
            type="button"
            className="btn-small"
            onClick={() => setShowRecipes(true)}
            aria-label={`Find recipes for ${item.name}`}
          >
            🍳 Recipes
          </button>
        )}

        {isExpired && !isUsed && (
          <button
            type="button"
            className="btn-small btn-warn"
            onClick={() => setShowDisposal(true)}
            aria-label={`View disposal tips for ${item.name}`}
          >
            ♻️ Disposal Tips
          </button>
        )}

        {!isUsed && (
          <button
            type="button"
            className="btn-small"
            onClick={() => setShowEdit(true)}
            disabled={busy}
            aria-label={`Edit ${item.name}`}
          >
            ✏️ Edit
          </button>
        )}

        <button
          type="button"
          className="btn-small btn-danger"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={busy}
          aria-label={`Delete ${item.name}`}
        >
          🗑️ Delete
        </button>
      </div>

      {showRecipes && <RecipeModal item={item} onClose={() => setShowRecipes(false)} />}
      {showDisposal && <DisposalModal item={item} onClose={() => setShowDisposal(false)} />}
      {showEdit && (
        <EditItemForm
          item={item}
          onItemUpdated={() => {
            showToast({ message: `Updated "${item.name}"`, type: 'success' });
            onChanged();
          }}
          onClose={() => setShowEdit(false)}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Item"
        message={`Are you sure you want to permanently delete "${item.name}" from your log?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </article>
  );
}
