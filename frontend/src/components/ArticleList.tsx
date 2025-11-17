/**
 * ArticleList Component
 *
 * Example component demonstrating DataProvider usage
 */

import { useState } from 'react';
import { useArticles } from '../hooks/useArticles';
import type { Article } from '@savetoread/shared';

export function ArticleList() {
  const { articles, loading, error, createArticle, updateArticle, deleteArticle } = useArticles();
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (loading) {
    return <div className="loading">Loading articles...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="article-list">
      <h1>My Articles</h1>

      <form onSubmit={handleSubmit} className="add-article-form">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Enter article URL..."
          disabled={isSubmitting}
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Article'}
        </button>
      </form>

      <div className="articles">
        {articles.length === 0 ? (
          <p className="empty-state">No articles yet. Add your first article above!</p>
        ) : (
          articles.map((article) => (
            <article key={article.id} className="article-card">
              <div className="article-header">
                <h2>{article.title || article.url}</h2>
                <div className="article-actions">
                  <button
                    onClick={() => handleToggleFavorite(article)}
                    className={article.isFavorite ? 'favorite active' : 'favorite'}
                    aria-label="Toggle favorite"
                  >
                    ★
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="delete"
                    aria-label="Delete article"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {article.excerpt && (
                <p className="article-excerpt">{article.excerpt}</p>
              )}

              {article.author && (
                <p className="article-author">By {article.author}</p>
              )}

              <div className="article-meta">
                {article.tags.length > 0 && (
                  <div className="article-tags">
                    {article.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}

                {article.readProgress > 0 && (
                  <div className="reading-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${article.readProgress}%` }}
                      />
                    </div>
                    <span>{article.readProgress}% read</span>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
