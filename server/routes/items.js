const express = require('express');
const auth = require('../middleware/auth');
const Item = require('../models/Item');
const { getDisposalSuggestions } = require('../utils/disposalSuggestions');

const router = express.Router();

const VALID_UNITS = ['unit', 'g', 'kg', 'ml', 'litre'];

function validateQuantity(quantityValue, quantityUnit) {
  const numericValue = Number(quantityValue);
  if (quantityValue === undefined || quantityValue === null || quantityValue === '') {
    return { error: 'Quantity is required' };
  }
  if (Number.isNaN(numericValue)) {
    return { error: 'Quantity must be a number' };
  }
  if (numericValue <= 0) {
    return { error: 'Quantity must be greater than 0' };
  }
  if (quantityUnit && !VALID_UNITS.includes(quantityUnit)) {
    return { error: 'Invalid quantity unit' };
  }
  return { value: numericValue };
}

// @route  GET /api/items
// Returns all items for the logged-in user, newest first.
// Items stay in the list until the user explicitly deletes/marks them used.
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find({ user: req.userId }).sort({ expiryDate: 1 });

    // Attach live-computed fields the frontend needs without extra requests
    const now = new Date();
    const enriched = items.map((item) => {
      const daysLeft = Math.ceil((item.expiryDate - now) / (1000 * 60 * 60 * 24));
      const isExpired = item.status !== 'used' && daysLeft < 0;
      const isExpiringSoon = item.status === 'active' && daysLeft >= 0 && daysLeft <= 2;

      const obj = item.toObject();
      obj.daysLeft = daysLeft;
      obj.isExpiringSoon = isExpiringSoon;

      // If it has passed expiry and was never used, surface disposal tips directly
      if (isExpired && item.status === 'active') {
        obj.disposalSuggestions = getDisposalSuggestions(item.name, item.category);
      }
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching items' });
  }
});

// @route  POST /api/items
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, quantityValue, quantityUnit, purchaseDate, expiryDate } = req.body;
    if (!name || !expiryDate) {
      return res.status(400).json({ message: 'Item name and expiry date are required' });
    }

    const { error, value } = validateQuantity(quantityValue, quantityUnit);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const item = await Item.create({
      user: req.userId,
      name,
      category: category || 'other',
      quantityValue: value,
      quantityUnit: quantityUnit || 'unit',
      purchaseDate: purchaseDate || Date.now(),
      expiryDate,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding item' });
  }
});

// @route  PUT /api/items/:id
// Edits an existing item's details (name, category, quantity, expiry date)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, quantityValue, quantityUnit, expiryDate } = req.body;
    if (!name || !expiryDate) {
      return res.status(400).json({ message: 'Item name and expiry date are required' });
    }

    const { error, value } = validateQuantity(quantityValue, quantityUnit);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      {
        name,
        category: category || 'other',
        quantityValue: value,
        quantityUnit: quantityUnit || 'unit',
        expiryDate,
        // Reset notification flags so a changed expiry date gets freshly
        // re-evaluated instead of staying stuck on old alert state.
        expiringSoonNotified: false,
        expiredNotified: false,
      },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating item' });
  }
});

// @route  PATCH /api/items/:id/used
// Marks an item as used (keeps a record but flags it out of the active list)
router.patch('/:id/used', auth, async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { status: 'used' },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating item' });
  }
});

// @route  DELETE /api/items/:id
// Permanently removes the item from the log
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting item' });
  }
});

module.exports = router;
