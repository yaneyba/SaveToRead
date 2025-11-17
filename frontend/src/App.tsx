/**
 * App Component
 *
 * Main application component
 */

import { AuthProvider } from './components/AuthProvider';
import { ArticleList } from './components/ArticleList';
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
        <h1>SaveToRead</h1>
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
