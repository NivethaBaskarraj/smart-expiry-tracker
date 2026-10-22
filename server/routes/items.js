const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Item = require('../models/Item');
const { getDisposalSuggestions } = require('../utils/disposalSuggestions');
const { computeItemStatus, toUtcStartOfDay } = require('../utils/dateUtils');

const router = express.Router();

const VALID_CATEGORIES = ['produce', 'dairy', 'meat_seafood', 'bakery', 'pantry', 'beverage', 'other'];
const VALID_UNITS = ['unit', 'g', 'kg', 'ml', 'litre'];

function validateQuantity(quantityValue, quantityUnit) {
  if (quantityValue === undefined || quantityValue === null || quantityValue === '') {
    return { error: 'Quantity is required' };
  }
  const numericValue = Number(quantityValue);
  if (Number.isNaN(numericValue)) {
    return { error: 'Quantity must be a number' };
  }
  if (numericValue <= 0) {
    return { error: 'Quantity must be greater than 0' };
  }
  if (numericValue > 100000) {
    return { error: 'Quantity cannot exceed 100,000' };
  }
  if (quantityUnit && !VALID_UNITS.includes(quantityUnit)) {
    return { error: 'Invalid quantity unit' };
  }
  return { value: numericValue };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// @route  GET /api/items
// Returns all items for the logged-in user, sorted by expiry date ascending.
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find({ user: req.userId }).sort({ expiryDate: 1 });

    const now = new Date();
    const enriched = items.map((item) => {
      const { daysLeft, isExpired, isExpiringSoon, statusLabel } = computeItemStatus(item, now);

      const obj = item.toObject();
      obj.daysLeft = daysLeft;
      obj.isExpired = isExpired;
      obj.isExpiringSoon = isExpiringSoon;
      obj.statusLabel = statusLabel;

      // Surface disposal tips if the item has expired and was not consumed
      if (isExpired && item.status !== 'used') {
        obj.disposalSuggestions = getDisposalSuggestions(item.name, item.category);
      }
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ message: 'Server error fetching items' });
  }
});

// @route  POST /api/items
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, quantityValue, quantityUnit, purchaseDate, expiryDate, quantity } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Item name is required' });
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({ message: 'Item name must be 100 characters or less' });
    }

    if (!expiryDate) {
      return res.status(400).json({ message: 'Expiry date is required' });
    }
    const parsedExpiry = toUtcStartOfDay(expiryDate);
    if (!parsedExpiry) {
      return res.status(400).json({ message: 'Invalid expiry date format' });
    }

    const { error, value } = validateQuantity(quantityValue, quantityUnit);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'other';

    const item = await Item.create({
      user: req.userId,
      name: trimmedName,
      category: safeCategory,
      quantity: quantity || null,
      quantityValue: value,
      quantityUnit: quantityUnit || 'unit',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : Date.now(),
      expiryDate: parsedExpiry,
      status: 'active',
    });

    const statusInfo = computeItemStatus(item);
    const enriched = {
      ...item.toObject(),
      ...statusInfo,
    };

    res.status(201).json(enriched);
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).json({ message: 'Server error adding item' });
  }
});

// @route  PUT /api/items/:id
router.put('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const { name, category, quantityValue, quantityUnit, expiryDate, quantity } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Item name is required' });
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({ message: 'Item name must be 100 characters or less' });
    }

    if (!expiryDate) {
      return res.status(400).json({ message: 'Expiry date is required' });
    }
    const parsedExpiry = toUtcStartOfDay(expiryDate);
    if (!parsedExpiry) {
      return res.status(400).json({ message: 'Invalid expiry date format' });
    }

    const { error, value } = validateQuantity(quantityValue, quantityUnit);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'other';

    // Find the item first to check status
    const existing = await Item.findOne({ _id: req.params.id, user: req.userId });
    if (!existing) {
      return res.status(404).json({ message: 'Item not found' });
    }

    existing.name = trimmedName;
    existing.category = safeCategory;
    existing.quantityValue = value;
    existing.quantityUnit = quantityUnit || 'unit';
    if (quantity !== undefined) existing.quantity = quantity;
    existing.expiryDate = parsedExpiry;

    // If an expired item's expiry date was extended to the future, restore to active
    const daysLeft = Math.round((parsedExpiry.getTime() - toUtcStartOfDay(new Date()).getTime()) / 86400000);
    if (existing.status === 'expired' && daysLeft >= 0) {
      existing.status = 'active';
      existing.expiredNotified = false;
      existing.expiringSoonNotified = false;
    } else {
      // Fresh expiry date re-evaluates notifications
      existing.expiringSoonNotified = false;
      existing.expiredNotified = false;
    }

    await existing.save();

    const statusInfo = computeItemStatus(existing);
    const enriched = {
      ...existing.toObject(),
      ...statusInfo,
    };
    if (enriched.isExpired && existing.status !== 'used') {
      enriched.disposalSuggestions = getDisposalSuggestions(existing.name, existing.category);
    }

    res.json(enriched);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ message: 'Server error updating item' });
  }
});

// @route  PATCH /api/items/:id/used
// Marks an item as used (regardless of whether it was active or expired)
router.patch('/:id/used', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { status: 'used' },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const statusInfo = computeItemStatus(item);
    res.json({ ...item.toObject(), ...statusInfo });
  } catch (err) {
    console.error('Error marking item as used:', err);
    res.status(500).json({ message: 'Server error updating item' });
  }
});

// @route  DELETE /api/items/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const item = await Item.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: 'Server error deleting item' });
  }
});

module.exports = router;
