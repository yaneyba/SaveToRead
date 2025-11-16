/**
 * App Component
 *
 * Main application component
 */

import { AuthProvider } from './components/AuthProvider';
import { ArticleList } from './components/ArticleList';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="auth-page">
        <h1>Welcome to ReadItLater</h1>
        <p>Please sign in to continue</p>
        {/* Sign in form would go here */}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>ReadItLater</h1>
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
