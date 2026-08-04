import React, { useState } from 'react';
import api from '../api/axios';

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
  const [name, setName] = useState('');
  const [category, setCategory] = useState('produce');
  const [quantityValue, setQuantityValue] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState('unit');
  const [expiryDate, setExpiryDate] = useState('');
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
      const res = await api.post('/items', {
        name,
        category,
        quantityValue: numericQuantity,
        quantityUnit,
        expiryDate,
      });
      onItemAdded(res.data);
      setName('');
      setQuantityValue('1');
      setQuantityUnit('unit');
      setExpiryDate('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add item');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Add Grocery Item</h2>
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
            {submitting ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
