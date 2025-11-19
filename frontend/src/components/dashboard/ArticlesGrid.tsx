/**
 * Articles Grid Component
 *
 * Displays articles in a grid layout with actions
 */

import type { Article } from '@savetoread/shared';

interface ArticlesGridProps {
  articles: Article[];
  loading: boolean;
  error: string | null;
  totalArticles: number;
  onToggleFavorite: (article: Article) => void;
  onDelete: (id: string) => void;
}

export function ArticlesGrid({
  articles,
  loading,
  error,
  totalArticles,
  onToggleFavorite,
  onDelete
}: ArticlesGridProps) {
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (articles.length === 0 && totalArticles > 0) {
    return (
      <div className="dashboard-empty">
        <p>No articles match your filters.</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="dashboard-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
          <path d="M7 7h10M7 12h10M7 17h7" />
        </svg>
        <h2>Start Building Your Library</h2>
        <p>Save your first article by pasting a URL above!</p>
      </div>
    );
  }

  return (
    <div className="articles-grid">
      {articles.map((article) => (
        <article key={article.id} className="article-card-modern">
          <div className="article-card-header">
            <h3 className="article-title">{article.title || article.url}</h3>
            <div className="article-actions">
              <button
                onClick={() => onToggleFavorite(article)}
                className={`action-button ${article.isFavorite ? 'favorite active' : 'favorite'}`}
                aria-label="Toggle favorite"
                title={article.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={article.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(article.id)}
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
  );
}
