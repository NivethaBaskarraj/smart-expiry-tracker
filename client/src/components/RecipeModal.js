import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function RecipeModal({ item, onClose }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchRecipes() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/recipes', { params: { ingredient: item.name } });
        if (!cancelled) setRecipes(res.data.recipes);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load recipes');
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
        <h2>Recipe ideas using {item.name}</h2>

        {loading && <p>Loading recipes...</p>}
        {error && <div className="error-banner">{error}</div>}

        {!loading && !error && recipes.length === 0 && (
          <p>No recipes found for this ingredient right now.</p>
        )}

        <div className="recipe-grid">
          {recipes.map((r) => (
            <a key={r.id} href={r.sourceUrl} target="_blank" rel="noreferrer" className="recipe-card">
              {r.image && <img src={r.image} alt={r.title} />}
              <div className="recipe-info">
                <h4>{r.title}</h4>
                <p>
                  Uses {r.usedIngredientCount} ingredient(s) you have · needs{' '}
                  {r.missedIngredientCount} more
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
