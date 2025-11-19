/**
 * Dashboard Page Component
 *
 * Main dashboard view for authenticated users
 */

import { useState } from 'react';
import { useArticles } from '@/hooks/useArticles';
import { useAuth } from '@/hooks/useAuth';
import { InfoModal } from '@/components/InfoModal';
import { Header } from '@/components/Header';
import type { Article } from '@savetoread/shared';
import { AddArticleForm } from '@/components/dashboard/AddArticleForm';
import { DashboardControls } from '@/components/dashboard/DashboardControls';
import { ArticlesGrid } from '@/components/dashboard/ArticlesGrid';
import '@/styles/dashboard.css';

export function Dashboard() {
  const { user } = useAuth();
  const { articles, loading, error, createArticle, updateArticle, deleteArticle } = useArticles();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'unread'>('all');
  const [showSidebar, setShowSidebar] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ title: string; message: string } | null>(null);

  const showComingSoon = (feature: string) => {
    setModalInfo({
      title: `${feature} Coming Soon!`,
      message: `We're working hard to bring you the ${feature.toLowerCase()} feature. Stay tuned for updates!`
    });
    setShowSidebar(false);
  };

  const handleCreateArticle = async (url: string) => {
    await createArticle(url);
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
      {/* Sidebar Navigation */}
      {showSidebar && (
        <>
          <div 
            className="sidebar-overlay" 
            onClick={() => setShowSidebar(false)}
          />
          <aside className="dashboard-sidebar">
            <div className="sidebar-header">
              <h2>Menu</h2>
              <button 
                className="sidebar-close"
                onClick={() => setShowSidebar(false)}
                aria-label="Close sidebar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="sidebar-nav">
              <div className="sidebar-section">
                <button className="sidebar-item active" onClick={() => setShowSidebar(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Dashboard
                </button>
                <button className="sidebar-item" onClick={() => showComingSoon('Library')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  Library
                </button>
                <button className="sidebar-item" onClick={() => showComingSoon('Favorites')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Favorites
                </button>
                <button className="sidebar-item" onClick={() => showComingSoon('Archive')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                  Archive
                </button>
              </div>
            </nav>
          </aside>
        </>
      )}

      <Header onMenuClick={() => setShowSidebar(true)} showMenu />
      
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="dashboard-welcome-section">
          <div>
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

        <AddArticleForm onSubmit={handleCreateArticle} />

        <DashboardControls
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <ArticlesGrid
          articles={filteredArticles}
          loading={loading}
          error={error}
          totalArticles={articles.length}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
        />
      </div>

      {modalInfo && (
        <InfoModal
          title={modalInfo.title}
          message={modalInfo.message}
          onClose={() => setModalInfo(null)}
        />
      )}
    </div>
  );
}
