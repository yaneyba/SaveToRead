/**
 * App Component
 *
 * Main application component
 */

import { AuthProvider } from './components/AuthProvider';
import { ArticleList } from './components/ArticleList';
import { LogoIcon } from './components/Logo';
import { LandingPage } from './pages/LandingPage';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="flex items-center gap-2">
          <LogoIcon size={32} className="text-orange-500" />
          <h1>SaveToRead</h1>
        </div>
        <div className="user-info">
          <span>{user.displayName}</span>
          <button onClick={signOut}>Sign Out</button>
        </div>
      </header>

      <main className="app-main">
        <ArticleList />
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
