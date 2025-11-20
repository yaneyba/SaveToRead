/**
 * Dashboard Page Component
 *
 * Main dashboard view for authenticated users
 */

import { useState, useEffect } from 'react';
import { useArticles } from '@/hooks/useArticles';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { Modal, ModalActions, ModalButton } from '@/components/Modal';
import type { Article } from '@savetoread/shared';
import { AddArticleForm } from '@/components/dashboard/AddArticleForm';
import { DashboardControls } from '@/components/dashboard/DashboardControls';
import { ArticlesGrid } from '@/components/dashboard/ArticlesGrid';
import { Pagination } from '@/components/dashboard/Pagination';
import { SITE_CONFIG } from '@/config/site';
import '@/styles/dashboard.css';

export function Dashboard() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(SITE_CONFIG.pagination.defaultPageSize);
  const { articles, loading, error, pagination, createArticle, updateArticle, deleteArticle, refresh } = useArticles({ page, pageSize });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'unread'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; articleId: string | null }>({
    isOpen: false,
    articleId: null
  });

  // Listen for article saving events from extension
  useEffect(() => {
    const handleSavingStarted = () => {
      console.log('[Dashboard] Saving started event received, showing toast');
      setToast({ message: 'Saving to Read...', type: 'info' });
    };

    const handleArticleSaved = () => {
      console.log('[Dashboard] Article saved event received, showing toast');
      setToast({ message: 'Article saved successfully!', type: 'success' });
    };

    window.addEventListener('savetoread:savingStarted', handleSavingStarted);
    window.addEventListener('savetoread:articleSaved', handleArticleSaved);
    console.log('[Dashboard] Listening for savetoread events');

    return () => {
      window.removeEventListener('savetoread:savingStarted', handleSavingStarted);
      window.removeEventListener('savetoread:articleSaved', handleArticleSaved);
    };
  }, []);

  const handleCreateArticle = async (url: string) => {
    try {
      await createArticle(url);
      setToast({ message: 'Article saved successfully!', type: 'success' });
    } catch (err) {
      console.error('Failed to create article:', err);
      setToast({ message: 'Failed to save article. Please try again.', type: 'error' });
      // Refresh to try to recover from any partial state
      refresh();
    }
  };

  const handleToggleFavorite = async (article: Article) => {
    try {
      await updateArticle(article.id, { isFavorite: !article.isFavorite });
    } catch (err) {
      console.error('Failed to update article:', err);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, articleId: id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.articleId) return;

    try {
      await deleteArticle(deleteModal.articleId);
      setToast({ message: 'Article deleted successfully', type: 'success' });
      setDeleteModal({ isOpen: false, articleId: null });
    } catch (err) {
      console.error('Failed to delete article:', err);
      setToast({ message: 'Failed to delete article', type: 'error' });
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

  // Calculate stats from pagination total, not current page
  const stats = {
    total: pagination?.total || 0,
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
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <ArticlesGrid
          articles={filteredArticles}
          loading={loading}
          error={error}
          totalArticles={articles.length}
          viewMode={viewMode}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
        />

        {pagination && (
          <Pagination
            currentPage={pagination.page}
            totalPages={Math.ceil(pagination.total / pagination.pageSize)}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, articleId: null })}
        title="Delete Article?"
        subtitle="This action cannot be undone. The article will be permanently removed from your library."
        type="danger"
        size="sm"
      >
        <ModalActions align="space-between">
          <ModalButton
            variant="ghost"
            onClick={() => setDeleteModal({ isOpen: false, articleId: null })}
          >
            Cancel
          </ModalButton>
          <ModalButton
            variant="danger"
            onClick={confirmDelete}
          >
            Delete
          </ModalButton>
        </ModalActions>
      </Modal>
    </div>
  );
}
