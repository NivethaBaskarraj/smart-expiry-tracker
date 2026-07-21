const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// @route  GET /api/recipes?ingredient=Milk
// Uses Spoonacular's findByIngredients endpoint to suggest recipes
// that make use of the given ingredient before it expires.
router.get('/', auth, async (req, res) => {
  try {
    const { ingredient } = req.query;
    if (!ingredient) {
      return res.status(400).json({ message: 'ingredient query param is required' });
    }

    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey || apiKey === 'your_spoonacular_api_key_here') {
      return res.status(500).json({
        message:
          'Spoonacular API key is not configured on the server. Add SPOONACULAR_API_KEY to server/.env',
      });
    }

    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        apiKey,
        ingredients: ingredient,
        number: 5,
        ranking: 1,
        ignorePantry: true,
      },
    });

    const recipes = response.data.map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      usedIngredientCount: r.usedIngredientCount,
      missedIngredientCount: r.missedIngredientCount,
      missedIngredients: (r.missedIngredients || []).map((m) => m.name),
      sourceUrl: `https://spoonacular.com/recipes/${r.title.replace(/\s+/g, '-')}-${r.id}`,
    }));

    res.json({ ingredient, recipes });
  } catch (err) {
    console.error('Recipe fetch error:', err.response?.data || err.message);
    res.status(502).json({ message: 'Could not fetch recipe suggestions right now' });
  }
});

module.exports = router;
