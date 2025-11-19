/**
 * App Component
 *
 * Main application component
 */

import { useState } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import { Dashboard } from '@/pages/Dashboard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LandingPage } from '@/pages/LandingPage';
import { useAuth } from '@/hooks/useAuth';

function AppContent() {
  const { user, loading } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <div className="app">
      <Header
        showMenu={true}
        onMenuClick={toggleMobileMenu}
      />

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <>
          <div
            className="mobile-menu-overlay"
            onClick={closeMobileMenu}
          />
          <nav className="mobile-menu">
            <div className="mobile-menu-header">
              <h2>Menu</h2>
              <button
                className="mobile-menu-close"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mobile-menu-nav">
              <a href="/library" className="mobile-nav-link" onClick={closeMobileMenu}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Library
              </a>
              <a href="/favorites" className="mobile-nav-link" onClick={closeMobileMenu}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                Favorites
              </a>
              <a href="/archive" className="mobile-nav-link" onClick={closeMobileMenu}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                Archive
              </a>
            </div>
          </nav>
        </>
      )}

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
