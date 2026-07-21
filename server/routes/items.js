const express = require('express');
const auth = require('../middleware/auth');
const Item = require('../models/Item');
const { getDisposalSuggestions } = require('../utils/disposalSuggestions');

const router = express.Router();

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
    const { name, category, quantity, purchaseDate, expiryDate } = req.body;
    if (!name || !expiryDate) {
      return res.status(400).json({ message: 'Item name and expiry date are required' });
    }

    const item = await Item.create({
      user: req.userId,
      name,
      category: category || 'other',
      quantity: quantity || '1',
      purchaseDate: purchaseDate || Date.now(),
      expiryDate,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding item' });
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
