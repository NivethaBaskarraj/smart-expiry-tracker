import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api/axios';
import Navbar from './Navbar';
import AddItemForm from './AddItemForm';
import ItemCard from './ItemCard';
import ItemCardSkeleton from './ItemCardSkeleton';
import DashboardStats from './DashboardStats';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('expiry-asc');

  const notifyBrowserForExpiringItems = useCallback((itemList) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const today = new Date().toDateString();
    const alreadyNotifiedKey = `notified-${today}`;
    const alreadyNotified = JSON.parse(localStorage.getItem(alreadyNotifiedKey) || '[]');

    const toNotify = itemList.filter(
      (i) => i.isExpiringSoon && i.status !== 'used' && !alreadyNotified.includes(i._id)
    );

    toNotify.forEach((i) => {
      const timeStr = i.daysLeft === 0 ? 'today' : `in ${i.daysLeft} day(s)`;
      new Notification('Smart Expiry Tracker', {
        body: `${i.name} expires ${timeStr} — use it soon!`,
        icon: '🥦',
      });
    });

    if (toNotify.length > 0) {
      localStorage.setItem(
        alreadyNotifiedKey,
        JSON.stringify([...alreadyNotified, ...toNotify.map((i) => i._id)])
      );
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/items');
      setItems(res.data);
      notifyBrowserForExpiringItems(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your items');
    } finally {
      setLoading(false);
    }
  }, [notifyBrowserForExpiringItems]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchItems();
  }, [fetchItems]);

  // Filter and sort items
  const processedItems = useMemo(() => {
    return items
      .filter((i) => {
        // Status filter
        if (filter === 'active' && !(i.status === 'active' && i.daysLeft >= 0)) return false;
        if (filter === 'expiring' && !(i.isExpiringSoon && i.status !== 'used')) return false;
        if (filter === 'expired' && !(i.status === 'expired' || (i.status !== 'used' && i.daysLeft < 0)))
          return false;
        if (filter === 'used' && i.status !== 'used') return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (i.name || '').toLowerCase().includes(q);
          const matchCategory = (i.category || '').toLowerCase().includes(q);
          if (!matchName && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry-asc') {
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        }
        if (sortBy === 'expiry-desc') {
          return new Date(b.expiryDate) - new Date(a.expiryDate);
        }
        if (sortBy === 'name-asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'name-desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        return 0;
      });
  }, [items, filter, searchQuery, sortBy]);

  return (
    <div className="app-layout">
      <Navbar />

      <main className="home-container">
        {/* Top Header */}
        <header className="home-header">
          <div>
            <h1>Your Groceries</h1>
            <p className="home-subheading">Track expiry dates, avoid food waste, and save money.</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
            aria-label="Add a new grocery item"
          >
            + Add Item
          </button>
        </header>

        {/* Dashboard Summary Stat Cards */}
        <DashboardStats items={items} currentFilter={filter} onSelectFilter={setFilter} />

        {/* Search, Filter, and Sort Controls */}
        <section className="controls-bar" aria-label="Inventory controls">
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              placeholder="Search groceries by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search groceries"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                &times;
              </button>
            )}
          </div>

          <div className="filter-sort-group">
            <div className="filter-bar" role="tablist" aria-label="Status filters">
              {[
                { key: 'all', label: 'All Items' },
                { key: 'active', label: 'Fresh' },
                { key: 'expiring', label: 'Expiring Soon' },
                { key: 'expired', label: 'Expired' },
                { key: 'used', label: 'Used' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  className={`filter-btn ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="sort-box">
              <label htmlFor="sort-select" className="sort-label">Sort:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort groceries"
              >
                <option value="expiry-asc">Expiry: Soonest first</option>
                <option value="expiry-desc">Expiry: Latest first</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </section>

        {/* Error Notification */}
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" className="btn-small btn-ghost" onClick={fetchItems}>
              Retry
            </button>
          </div>
        )}

        {/* Loading State with Skeletons */}
        {loading && (
          <div className="item-grid" aria-busy="true" aria-label="Loading items">
            {Array.from({ length: 6 }).map((_, idx) => (
              <ItemCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && processedItems.length === 0 && (
          <div className="empty-state-card" role="status">
            <div className="empty-state-icon" aria-hidden="true">🥗</div>
            {items.length === 0 ? (
              <>
                <h3>No grocery items added yet</h3>
                <p>Start tracking your pantry and fridge to get expiry reminders and recipe ideas.</p>
                <button
                  type="button"
                  className="btn-primary large"
                  onClick={() => setShowAddForm(true)}
                >
                  + Add Your First Item
                </button>
              </>
            ) : (
              <>
                <h3>No items match your criteria</h3>
                <p>Try clearing your search or switching to another filter tab.</p>
                <div className="empty-state-actions">
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </button>
                  )}
                  {filter !== 'all' && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setFilter('all')}
                    >
                      Show All Items
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Item Cards Grid */}
        {!loading && processedItems.length > 0 && (
          <div className="item-grid" role="feed" aria-label="Grocery items list">
            {processedItems.map((item) => (
              <ItemCard key={item._id} item={item} onChanged={fetchItems} />
            ))}
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      {showAddForm && (
        <AddItemForm onItemAdded={fetchItems} onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}
