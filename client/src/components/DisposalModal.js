import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function DisposalModal({ item, onClose }) {
  const [data, setData] = useState(item.disposalSuggestions || null);
  const [loading, setLoading] = useState(!item.disposalSuggestions);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
  }, [data, item.name, item.category]);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="disposal-modal-title"
      >
        <div className="modal-header">
          <h2 id="disposal-modal-title">♻️ Smart Disposal & Reuse: {item.name}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {loading && (
          <div className="modal-loading-box">
            <span className="spinner" aria-hidden="true"></span>
            <p>Loading eco-friendly disposal suggestions...</p>
          </div>
        )}

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {data && (
          <div className="disposal-content">
            {data.specificTips && data.specificTips.length > 0 && (
              <section className="disposal-section">
                <h4>💡 Smart reuse ideas for {item.name}</h4>
                <ul className="disposal-tips-list">
                  {data.specificTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="disposal-section">
              <h4>🌿 Category best practices ({data.category})</h4>
              <ul className="disposal-tips-list">
                {(data.generalTips || []).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </section>

            <div className="safety-note" role="note">
              <strong>⚠️ Safety Note: </strong>
              {data.safetyNote}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
