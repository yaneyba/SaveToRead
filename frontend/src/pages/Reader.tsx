/**
 * Article Reader Page
 *
 * Displays saved article content in a clean reading view
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDataProvider } from '@/providers/DataProviderFactory';
import type { Article } from '@savetoread/shared';
import '@/styles/reader.css';

export function Reader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const dataProvider = useDataProvider();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !token) return;

    const fetchArticle = async () => {
      try {
        const result = await dataProvider.getArticle(id);

        if (result.success && result.data) {
          setArticle(result.data);
        } else {
          throw new Error(result.error?.message || 'Failed to load article');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, token, dataProvider]);

  const handleDownload = async (format: 'pdf' | 'html' | 'epub' | 'markdown') => {
    if (!id || !token) return;

    // Only PDF and HTML are supported by the snapshot API currently
    if (format === 'epub' || format === 'markdown') {
      setSnapshotError(`${format.toUpperCase()} export is coming soon!`);
      setTimeout(() => setSnapshotError(null), 4000);
      return;
    }

    setSnapshotLoading(true);
    setSnapshotError(null);

    try {
      const result = await dataProvider.generateSnapshot(id, format);

      if (result.success && result.data) {
        const downloadUrl = result.data.cloudUrl || result.data.url;
        if (downloadUrl) {
          window.open(downloadUrl, '_blank');
        } else {
          setSnapshotError('Snapshot generated but no download URL returned. Check your storage settings.');
        }
      } else {
        const errorMessage = result.error?.message || 'Failed to generate snapshot';
        const errorCode = result.error?.code;
        
        if (errorCode === 'RATE_LIMIT_EXCEEDED') {
          setSnapshotError('⏱️ Snapshot service is temporarily busy. Please try again in a few minutes.');
        } else if (errorCode === 'BROWSER_ERROR' || errorMessage.includes('timeout')) {
          setSnapshotError('🔄 Snapshot generation timed out. The page may be too complex. Try again or use the Original link.');
        } else {
          setSnapshotError(errorMessage);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to download';
      setSnapshotError(errorMsg.includes('timeout') 
        ? '🔄 Request timed out. The page may be too large or slow to load.'
        : errorMsg
      );
    } finally {
      setSnapshotLoading(false);
      // Auto-dismiss error after 6 seconds
      setTimeout(() => setSnapshotError(null), 6000);
    }
  };

  if (loading) {
    return (
      <div className="reader-loading">
        <div className="loading-spinner"></div>
        <p>Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="reader-error">
        <h2>Failed to Load Article</h2>
        <p>{error || 'Article not found'}</p>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="reader">
      {/* Snapshot notification banner */}
      {(snapshotLoading || snapshotError) && (
        <div className={`reader-notification ${snapshotError ? 'error' : 'loading'}`}>
          <div className="notification-content">
            {snapshotLoading ? (
              <>
                <div className="notification-spinner"></div>
                <span>Generating snapshot...</span>
              </>
            ) : (
              <>
                <span className="notification-icon">⚠️</span>
                <span>{snapshotError}</span>
                <button 
                  className="notification-close" 
                  onClick={() => setSnapshotError(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <header className="reader-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>

        <div className="reader-actions">
          <button 
            onClick={() => handleDownload('pdf')} 
            className="action-btn" 
            title="Download as PDF"
            disabled={snapshotLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            PDF
          </button>
          <button 
            onClick={() => handleDownload('html')} 
            className="action-btn" 
            title="Download as HTML"
            disabled={snapshotLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            HTML
          </button>
          <button 
            onClick={() => handleDownload('epub')} 
            className="action-btn" 
            title="Download as EPUB"
            disabled={snapshotLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            EPUB
          </button>
          <button 
            onClick={() => handleDownload('markdown')} 
            className="action-btn" 
            title="Download as Markdown"
            disabled={snapshotLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            MD
          </button>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="action-btn" title="View original">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Original
          </a>
        </div>
      </header>

      <article className="reader-content">
        <header className="article-header">
          <div className="article-meta">
            {article.publishedDate && (
              <time className="article-date">
                {new Date(article.publishedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            )}
            {(article.wordCount || article.readingTimeMinutes) && (
              <div className="article-stats">
                {article.wordCount && <span>{article.wordCount.toLocaleString()} words</span>}
                {article.wordCount && article.readingTimeMinutes && <span>•</span>}
                {article.readingTimeMinutes && <span>{article.readingTimeMinutes} min read</span>}
              </div>
            )}
          </div>

          <h1>{article.title}</h1>
          
          {article.author && (
            <p className="article-author">
              <span className="author-prefix">By</span> {article.author}
            </p>
          )}
        </header>

        {article.imageUrl && (
          <img src={article.imageUrl} alt={article.title} className="article-image" />
        )}

        <div className="article-body">
          {/* Render markdown content */}
          <div dangerouslySetInnerHTML={{ __html: formatContent(article.content || '') }} />
        </div>
      </article>
    </div>
  );
}

/**
 * Basic markdown-to-HTML formatter
 * Converts common markdown patterns to HTML
 */
function formatContent(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<ol')) {
      return p;
    }
    return p.trim() ? `<p>${p.trim()}</p>` : '';
  }).join('\n');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}
