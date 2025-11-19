/**
 * Add Article Form Component
 *
 * Form for adding new articles to the library
 */

import { useState } from 'react';

interface AddArticleFormProps {
  onSubmit: (url: string) => Promise<void>;
}

export function AddArticleForm({ onSubmit }: AddArticleFormProps) {
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(newUrl);
      setNewUrl('');
    } catch (err) {
      console.error('Failed to create article:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}
