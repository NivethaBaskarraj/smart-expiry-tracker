import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import Navbar from './Navbar';
import AddItemForm from './AddItemForm';
import ItemCard from './ItemCard';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/items');
      setItems(res.data);
      notifyBrowserForExpiringItems(res.data);
    } catch (err) {
      setError('Could not load your items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchItems();
  }, [fetchItems]);

  function notifyBrowserForExpiringItems(itemList) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const today = new Date().toDateString();
    const alreadyNotifiedKey = `notified-${today}`;
    const alreadyNotified = JSON.parse(localStorage.getItem(alreadyNotifiedKey) || '[]');

    const toNotify = itemList.filter(
      (i) => i.isExpiringSoon && !alreadyNotified.includes(i._id)
    );

    toNotify.forEach((i) => {
      new Notification('Smart Expiry Tracker', {
        body: `${i.name} expires in ${i.daysLeft} day(s) — use it soon!`,
        icon: '🥦',
      });
    });

    if (toNotify.length > 0) {
      localStorage.setItem(
        alreadyNotifiedKey,
        JSON.stringify([...alreadyNotified, ...toNotify.map((i) => i._id)])
      );
    }
  }

  const visibleItems = items.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'active') return i.status === 'active' && i.daysLeft >= 0;
    if (filter === 'expiring') return i.isExpiringSoon;
    if (filter === 'expired') return i.status === 'active' && i.daysLeft < 0;
    if (filter === 'used') return i.status === 'used';
    return true;
  });

  return (
    <div>
      <Navbar />
      <div className="home-container">
        <div className="home-header">
          <h1>Your Groceries</h1>
          <button onClick={() => setShowAddForm(true)}>+ Add Item</button>
        </div>

        <div className="filter-bar">
          {['all', 'active', 'expiring', 'expired', 'used'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading && <p>Loading...</p>}
        {error && <div className="error-banner">{error}</div>}

        {!loading && visibleItems.length === 0 && (
          <p className="empty-state">No items here yet. Add your first grocery item!</p>
        )}

        <div className="item-grid">
          {visibleItems.map((item) => (
            <ItemCard key={item._id} item={item} onChanged={fetchItems} />
          ))}
        </div>
      </div>

      {showAddForm && (
        <AddItemForm onItemAdded={fetchItems} onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}
