/**
 * useAuth Hook
 *
 * Custom hook for authentication using the DataProvider
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { User } from '@savetoread/shared';
import { useDataProvider } from '../providers/DataProviderFactory';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useAuthProvider(): AuthContextValue {
  const dataProvider = useDataProvider();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const response = await dataProvider.getCurrentUser();

    if (response.success && response.data) {
      setUser(response.data);
    } else {
      // Token invalid, clear it
      localStorage.removeItem('auth_token');
    }

    setLoading(false);
  }, [dataProvider]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const response = await dataProvider.signIn(email, password);

    if (response.success && response.data) {
      setUser(response.data.user);
    } else {
      throw new Error(response.error?.message || 'Sign in failed');
    }
  }, [dataProvider]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setError(null);
    const response = await dataProvider.signUp(email, password, displayName);

    if (response.success && response.data) {
      setUser(response.data.user);
    } else {
      throw new Error(response.error?.message || 'Sign up failed');
    }
  }, [dataProvider]);

  const signOut = useCallback(async () => {
    await dataProvider.signOut();
    setUser(null);
  }, [dataProvider]);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshUser: fetchCurrentUser
  };
}

export { AuthContext };
