/**
 * App Component
 *
 * Main application component
 */

import { AuthProvider } from '@/components/AuthProvider';
import { Dashboard } from '@/pages/Dashboard';
import { Footer } from '@/components/Footer';
import { LandingPage } from '@/pages/LandingPage';
import { useAuth } from '@/hooks/useAuth';

function AppContent() {
  const { user, loading } = useAuth();

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
      <main className="app-main">
        <Dashboard />
      </main>

      <Footer variant="minimal" />
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
