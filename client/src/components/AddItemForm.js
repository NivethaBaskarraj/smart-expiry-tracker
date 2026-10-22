import React, { useState } from 'react';
import api from '../api/axios';
import { getTodayDateInputValue } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  { value: 'produce', label: 'Fruits & Vegetables' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'meat_seafood', label: 'Meat & Seafood' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'pantry', label: 'Pantry / Grains' },
  { value: 'beverage', label: 'Beverages' },
  { value: 'other', label: 'Other' },
];

export const UNITS = [
  { value: 'unit', label: 'unit(s)' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'litre', label: 'litre' },
];

export default function AddItemForm({ onItemAdded, onClose }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('produce');
  const [quantityValue, setQuantityValue] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState('unit');
  const [expiryDate, setExpiryDate] = useState(getTodayDateInputValue());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Item name cannot be empty');
      return;
    }

    const numericQuantity = Number(quantityValue);
    if (quantityValue === '' || Number.isNaN(numericQuantity) || numericQuantity <= 0) {
      setError('Quantity must be a number greater than 0');
      return;
    }

    if (!expiryDate) {
      setError('Please select an expiry date');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/items', {
        name: name.trim(),
        category,
        quantityValue: numericQuantity,
        quantityUnit,
        expiryDate,
      });
      showToast({ message: `Added "${res.data.name}" to inventory!`, type: 'success' });
      onItemAdded(res.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not add item';
      setError(msg);
      showToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-title"
      >
        <h2 id="add-item-title">Add Grocery Item</h2>
        {error && <div className="error-banner">{error}</div>}

        <label htmlFor="add-item-name">Item Name</label>
        <input
          id="add-item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Fresh Milk"
        />

        <label htmlFor="add-item-category">Category</label>
        <select
          id="add-item-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <label htmlFor="add-item-quantity">Quantity</label>
        <div className="quantity-row">
          <input
            id="add-item-quantity"
            type="number"
            min="0.01"
            max="100000"
            step="any"
            value={quantityValue}
            onChange={(e) => setQuantityValue(e.target.value)}
            required
            placeholder="e.g. 1"
          />
          <select
            id="add-item-unit"
            value={quantityUnit}
            onChange={(e) => setQuantityUnit(e.target.value)}
            aria-label="Quantity unit"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <label htmlFor="add-item-expiry">Expiry Date</label>
        <input
          id="add-item-expiry"
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
            {submitting ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
