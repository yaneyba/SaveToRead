/**
 * useArticles Hook
 *
 * Custom hook for managing articles using the DataProvider
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Article, ListArticlesParams, PaginatedResponse, SaveToReadArticleSavedEvent } from '@savetoread/shared';
import { useDataProvider } from '@/providers/DataProviderFactory';

export function useArticles(params?: ListArticlesParams) {
  const dataProvider = useDataProvider();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<Article>, 'items'> | null>(null);
  
  // Use ref to track params to avoid infinite loops
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await dataProvider.listArticles(paramsRef.current);

      if (response.success && response.data) {
        setArticles(response.data.items);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize,
          hasMore: response.data.hasMore
        });
      } else {
        setError(response.error?.message || 'Failed to fetch articles');
      }
    } catch (err) {
      console.error('[useArticles] Failed to fetch articles', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, [dataProvider]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles, params?.page, params?.pageSize]);

  // Listen for article saved from extension - separate effect
  useEffect(() => {
    const handleArticleSaved = (event: Event) => {
      const customEvent = event as SaveToReadArticleSavedEvent;
      console.log('[SaveToRead] Article saved from extension, refreshing...', customEvent.detail);
      fetchArticles();
    };

    window.addEventListener('savetoread:articleSaved', handleArticleSaved);

    return () => {
      window.removeEventListener('savetoread:articleSaved', handleArticleSaved);
    };
  }, [fetchArticles]);

  const createArticle = useCallback(async (url: string, tags?: string[]) => {
    const response = await dataProvider.createArticle({ url, tags });

    if (response.success && response.data) {
      const created = response.data;
      setArticles(prev => [created, ...prev]);
      setPagination(prev => prev ? { ...prev, total: prev.total + 1 } : prev);
      await fetchArticles(); // Ensure pagination + ordering stay in sync
      return created;
    } else {
      throw new Error(response.error?.message || 'Failed to create article');
    }
  }, [dataProvider, fetchArticles]);

  const updateArticle = useCallback(async (id: string, updates: Partial<Article>) => {
    const response = await dataProvider.updateArticle(id, updates);

    if (response.success && response.data) {
      setArticles(prev =>
        prev.map(article => article.id === id ? response.data! : article)
      );
      return response.data;
    } else {
      throw new Error(response.error?.message || 'Failed to update article');
    }
  }, [dataProvider]);

  const deleteArticle = useCallback(async (id: string) => {
    const response = await dataProvider.deleteArticle(id);

    if (response.success) {
      setArticles(prev => prev.filter(article => article.id !== id));
      setPagination(prev => prev ? { ...prev, total: Math.max(prev.total - 1, 0) } : prev);
      await fetchArticles(); // Resync if pagination/page should shift
    } else {
      throw new Error(response.error?.message || 'Failed to delete article');
    }
  }, [dataProvider, fetchArticles]);

  return {
    articles,
    loading,
    error,
    pagination,
    refresh: fetchArticles,
    createArticle,
    updateArticle,
    deleteArticle
  };
}
