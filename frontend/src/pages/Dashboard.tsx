/**
 * Dashboard Page Component
 *
 * Main dashboard view for authenticated users
 */

import { useState } from 'react';
import { useArticles } from '@/hooks/useArticles';
import { useAuth } from '@/hooks/useAuth';
import type { Article } from '@savetoread/shared';
import '@/styles/dashboard.css';

export function Dashboard() {
  const { user } = useAuth();
  const { articles, loading, error, createArticle, updateArticle, deleteArticle } = useArticles();
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'unread'>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsSubmitting(true);
    try {
      await createArticle(newUrl);
      setNewUrl('');
    } catch (err) {
      console.error('Failed to create article:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavorite = async (article: Article) => {
    try {
      await updateArticle(article.id, { isFavorite: !article.isFavorite });
    } catch (err) {
      console.error('Failed to update article:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      await deleteArticle(id);
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  };

  // Filter articles based on active filter and search query
  const filteredArticles = articles.filter((article) => {
    // Apply filter
    if (activeFilter === 'favorites' && !article.isFavorite) return false;
    if (activeFilter === 'unread' && article.readProgress >= 100) return false;

    // Apply search
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title?.toLowerCase().includes(query) ||
      article.url.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query) ||
      article.author?.toLowerCase().includes(query) ||
      article.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Calculate stats
  const stats = {
    total: articles.length,
    favorites: articles.filter(a => a.isFavorite).length,
    unread: articles.filter(a => a.readProgress < 100).length,
    read: articles.filter(a => a.readProgress >= 100).length
  };

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Welcome back, {user?.displayName?.split(' ')[0] || 'there'}!</h1>
          <p>Your personal reading library</p>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Articles</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.favorites}</div>
            <div className="stat-label">Favorites</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.unread}</div>
            <div className="stat-label">To Read</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.read}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Add Article Form */}
      <div className="dashboard-add-section">
        <form onSubmit={handleSubmit} className="add-article-form-modern">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Paste article URL to save..."
            disabled={isSubmitting}
            required
            className="url-input"
          />
          <button type="submit" disabled={isSubmitting} className="add-button">
            {isSubmitting ? (
              <span>Adding...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Article
              </>
            )}
          </button>
        </form>
      </div>

      {/* Filters and Search */}
      <div className="dashboard-controls">
        <div className="filter-tabs">
          <button
            className={activeFilter === 'all' ? 'active' : ''}
            onClick={() => setActiveFilter('all')}
          >
            All Articles
          </button>
          <button
            className={activeFilter === 'favorites' ? 'active' : ''}
            onClick={() => setActiveFilter('favorites')}
          >
            Favorites
          </button>
          <button
            className={activeFilter === 'unread' ? 'active' : ''}
            onClick={() => setActiveFilter('unread')}
          >
            To Read
          </button>
        </div>

        <div className="search-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="search-input"
          />
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your articles...</p>
        </div>
      ) : error ? (
        <div className="dashboard-error">
          <p>Error: {error}</p>
        </div>
      ) : filteredArticles.length === 0 && articles.length > 0 ? (
        <div className="dashboard-empty">
          <p>No articles match your filters.</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="dashboard-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
            <path d="M7 7h10M7 12h10M7 17h7" />
          </svg>
          <h2>Start Building Your Library</h2>
          <p>Save your first article by pasting a URL above!</p>
        </div>
      ) : (
        <div className="articles-grid">
          {filteredArticles.map((article) => (
            <article key={article.id} className="article-card-modern">
              <div className="article-card-header">
                <h3 className="article-title">{article.title || article.url}</h3>
                <div className="article-actions">
                  <button
                    onClick={() => handleToggleFavorite(article)}
                    className={`action-button ${article.isFavorite ? 'favorite active' : 'favorite'}`}
                    aria-label="Toggle favorite"
                    title={article.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={article.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="action-button delete"
                    aria-label="Delete article"
                    title="Delete article"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {article.excerpt && (
                <p className="article-excerpt">{article.excerpt}</p>
              )}

              <div className="article-meta">
                {article.author && (
                  <span className="article-author">By {article.author}</span>
                )}
                {article.tags.length > 0 && (
                  <div className="article-tags">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="tag">+{article.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {article.readProgress > 0 && (
                <div className="reading-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${article.readProgress}%` }}
                    />
                  </div>
                  <span className="progress-text">{article.readProgress}% complete</span>
                </div>
              )}

              <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-button">
                {article.readProgress > 0 ? 'Continue Reading' : 'Start Reading'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
