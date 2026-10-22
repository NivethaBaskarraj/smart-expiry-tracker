const express = require('express');
const auth = require('../middleware/auth');
const { getDisposalSuggestions } = require('../utils/disposalSuggestions');

const router = express.Router();

// @route  GET /api/disposal?name=Milk&category=dairy
router.get('/', auth, (req, res) => {
  const { name, category } = req.query;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Item name is required' });
  }

  const cleanName = name.trim().slice(0, 100);
  const cleanCategory = typeof category === 'string' ? category.trim() : 'other';

  const suggestions = getDisposalSuggestions(cleanName, cleanCategory);
  res.json(suggestions);
});

module.exports = router;
