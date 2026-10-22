import React, { useState } from 'react';
import api from '../api/axios';
import { UNITS } from './AddItemForm';
import { toDateInputValue } from '../utils/dateUtils';

const CATEGORIES = [
  { value: 'produce', label: 'Fruits & Vegetables' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'meat_seafood', label: 'Meat & Seafood' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'pantry', label: 'Pantry / Grains' },
  { value: 'beverage', label: 'Beverages' },
  { value: 'other', label: 'Other' },
];

export default function EditItemForm({ item, onItemUpdated, onClose }) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category || 'other');
  const [quantityValue, setQuantityValue] = useState(
    item.quantityValue !== undefined && item.quantityValue !== null ? String(item.quantityValue) : '1'
  );
  const [quantityUnit, setQuantityUnit] = useState(item.quantityUnit || 'unit');
  const [expiryDate, setExpiryDate] = useState(toDateInputValue(item.expiryDate));
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
      const res = await api.put(`/items/${item._id}`, {
        name: name.trim(),
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

        <label htmlFor="edit-item-name">Item Name</label>
        <input
          id="edit-item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Milk"
        />

        <label htmlFor="edit-item-category">Category</label>
        <select
          id="edit-item-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <label htmlFor="edit-item-quantity">Quantity</label>
        <div className="quantity-row">
          <input
            id="edit-item-quantity"
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
            id="edit-item-unit"
            value={quantityUnit}
            onChange={(e) => setQuantityUnit(e.target.value)}
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <label htmlFor="edit-item-expiry">Expiry Date</label>
        <input
          id="edit-item-expiry"
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
