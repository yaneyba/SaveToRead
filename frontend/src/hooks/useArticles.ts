/**
 * useArticles Hook
 *
 * Custom hook for managing articles using the DataProvider
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Article, ListArticlesParams, PaginatedResponse } from '@savetoread/shared';
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

    setLoading(false);
  }, [dataProvider]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles, params?.page, params?.pageSize]);

  // Listen for article saved from extension - separate effect
  useEffect(() => {
    const handleArticleSaved = () => {
      console.log('[SaveToRead] Article saved from extension, refreshing...');
      fetchArticles();
    };
    
    window.addEventListener('savetoread:articleSaved', handleArticleSaved as EventListener);
    
    return () => {
      window.removeEventListener('savetoread:articleSaved', handleArticleSaved as EventListener);
    };
  }, [fetchArticles]);

  const createArticle = useCallback(async (url: string, tags?: string[]) => {
    const response = await dataProvider.createArticle({ url, tags });

    if (response.success && response.data) {
      setArticles(prev => [response.data!, ...prev]);
      return response.data;
    } else {
      throw new Error(response.error?.message || 'Failed to create article');
    }
  }, [dataProvider]);

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
    } else {
      throw new Error(response.error?.message || 'Failed to delete article');
    }
  }, [dataProvider]);

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
