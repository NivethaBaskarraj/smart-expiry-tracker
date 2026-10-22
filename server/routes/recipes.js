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
    if (!ingredient || typeof ingredient !== 'string' || !ingredient.trim()) {
      return res.status(400).json({ message: 'ingredient query parameter is required' });
    }

    const cleanIngredient = ingredient.trim().slice(0, 100);

    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey || apiKey === 'your_spoonacular_api_key_here') {
      return res.status(503).json({
        message:
          'Recipe suggestions are not configured on the server. Please set SPOONACULAR_API_KEY in server/.env',
      });
    }

    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        apiKey,
        ingredients: cleanIngredient,
        number: 5,
        ranking: 1,
        ignorePantry: true,
      },
      timeout: 8000,
    });

    const recipes = (response.data || []).map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      usedIngredientCount: r.usedIngredientCount || 0,
      missedIngredientCount: r.missedIngredientCount || 0,
      missedIngredients: (r.missedIngredients || []).map((m) => m.name),
      sourceUrl: `https://spoonacular.com/recipes/${encodeURIComponent(
        (r.title || '').replace(/\s+/g, '-')
      )}-${r.id}`,
    }));

    res.json({ ingredient: cleanIngredient, recipes });
  } catch (err) {
    console.error('Recipe fetch error:', err.response?.data || err.message);
    const statusCode = err.response?.status === 402 ? 429 : 502;
    const msg =
      err.response?.status === 402
        ? 'Spoonacular daily API quota reached. Please try again tomorrow.'
        : 'Could not fetch recipe suggestions right now';
    res.status(statusCode).json({ message: msg });
  }
});

module.exports = router;
