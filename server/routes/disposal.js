const express = require('express');
const auth = require('../middleware/auth');
const { getDisposalSuggestions } = require('../utils/disposalSuggestions');

const router = express.Router();

// @route  GET /api/disposal?name=Milk&category=dairy
router.get('/', auth, (req, res) => {
  const { name, category } = req.query;
  if (!name) {
    return res.status(400).json({ message: 'Item name is required' });
  }
  const suggestions = getDisposalSuggestions(name, category);
  res.json(suggestions);
});

module.exports = router;
