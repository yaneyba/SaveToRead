/**
 * Dashboard Page Component
 *
 * Main dashboard view for authenticated users
 */

import { useState } from 'react';
import { useArticles } from '@/hooks/useArticles';
import { useAuth } from '@/hooks/useAuth';
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
      <Header />
      
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

    </div>
  );
}
