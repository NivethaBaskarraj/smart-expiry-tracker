import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function DisposalModal({ item, onClose }) {
  const [data, setData] = useState(item.disposalSuggestions || null);
  const [loading, setLoading] = useState(!item.disposalSuggestions);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data) return;
    let cancelled = false;
    async function fetchSuggestions() {
      setLoading(true);
      try {
        const res = await api.get('/disposal', {
          params: { name: item.name, category: item.category },
        });
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError('Could not load disposal suggestions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSuggestions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
        <h2>♻️ Best way to dispose of {item.name}</h2>

        {loading && <p>Loading suggestions...</p>}
        {error && <div className="error-banner">{error}</div>}

        {data && (
          <>
            {data.specificTips.length > 0 && (
              <>
                <h4>Specific ideas for {item.name}</h4>
                <ul>
                  {data.specificTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </>
            )}

            <h4>General tips for this category</h4>
            <ul>
              {data.generalTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>

            <p className="safety-note">⚠️ {data.safetyNote}</p>
          </>
        )}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
