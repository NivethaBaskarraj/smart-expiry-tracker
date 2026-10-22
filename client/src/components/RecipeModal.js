import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function RecipeModal({ item, onClose }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function fetchRecipes() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/recipes', { params: { ingredient: item.name } });
        if (!cancelled) setRecipes(res.data.recipes || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load recipes for this ingredient');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRecipes();
    return () => {
      cancelled = true;
    };
  }, [item.name]);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-modal-title"
      >
        <div className="modal-header">
          <h2 id="recipe-modal-title">🍳 Recipes Using {item.name}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {loading && (
          <div className="modal-loading-box">
            <span className="spinner" aria-hidden="true"></span>
            <p>Searching delicious recipes for {item.name}...</p>
          </div>
        )}

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <div className="empty-recipes-box">
            <p>No recipes found using this ingredient. Try searching with a broader name in the edit screen!</p>
          </div>
        )}

        <div className="recipe-grid">
          {recipes.map((r) => (
            <a
              key={r.id}
              href={r.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="recipe-card"
            >
              {r.image ? (
                <img src={r.image} alt={r.title} loading="lazy" />
              ) : (
                <div className="recipe-placeholder">🍽️</div>
              )}
              <div className="recipe-info">
                <h4>{r.title}</h4>
                <p>
                  Uses {r.usedIngredientCount} ingredient(s) you have · needs{' '}
                  {r.missedIngredientCount} more
                </p>
                <span className="recipe-link-cta">View Recipe &rarr;</span>
              </div>
            </a>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
