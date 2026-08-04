import React, { useState } from 'react';
import api from '../api/axios';
import { UNITS } from './AddItemForm';

const CATEGORIES = [
  { value: 'produce', label: 'Fruits & Vegetables' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'meat_seafood', label: 'Meat & Seafood' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'pantry', label: 'Pantry / Grains' },
  { value: 'beverage', label: 'Beverages' },
  { value: 'other', label: 'Other' },
];

// Converts an ISO date string to yyyy-MM-dd for the date input's value
function toDateInputValue(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toISOString().slice(0, 10);
}

export default function EditItemForm({ item, onItemUpdated, onClose }) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [quantityValue, setQuantityValue] = useState(String(item.quantityValue ?? 1));
  const [quantityUnit, setQuantityUnit] = useState(item.quantityUnit || 'unit');
  const [expiryDate, setExpiryDate] = useState(toDateInputValue(item.expiryDate));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const numericQuantity = Number(quantityValue);
    if (quantityValue === '' || Number.isNaN(numericQuantity) || numericQuantity <= 0) {
      setError('Quantity must be a number greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/items/${item._id}`, {
        name,
        category,
        quantityValue: numericQuantity,
        quantityUnit,
        expiryDate,
      });
      onItemUpdated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update item');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Edit Grocery Item</h2>
        {error && <div className="error-banner">{error}</div>}

        <label>Item Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Milk" />

        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <label>Quantity</label>
        <div className="quantity-row">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantityValue}
            onChange={(e) => setQuantityValue(e.target.value)}
            required
            placeholder="e.g. 1"
          />
          <select value={quantityUnit} onChange={(e) => setQuantityUnit(e.target.value)}>
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <label>Expiry Date</label>
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          required
        />

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
