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

export default function AddItemForm({ onItemAdded, onClose }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('produce');
  const [quantity, setQuantity] = useState('1');
  const [expiryDate, setExpiryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/items', { name, category, quantity, expiryDate });
      onItemAdded(res.data);
      setName('');
      setQuantity('1');
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
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 1 liter" />

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
