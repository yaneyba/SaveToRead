/**
 * Header Component
 *
 * Reusable header component for authenticated pages
 */

import { useState, useEffect, useRef } from 'react';
import { Logo } from '@/components/Logo';
import { InfoModal } from '@/components/InfoModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { signOut, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ title: string; message: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const showComingSoon = (feature: string) => {
    setShowUserMenu(false);
    setModalInfo({
      title: `${feature} Coming Soon!`,
      message: `We're working hard to bring you the ${feature.toLowerCase()} feature. Stay tuned for updates!`
    });
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Left side - Logo */}
        <div className="header-left">
          <a href="/" className="header-logo">
            <Logo />
          </a>
        </div>

        {/* Center - Navigation */}
        <nav className="header-nav">
          <a href="/library" className="nav-link">
            Library
          </a>
          <a href="/favorites" className="nav-link">
            Favorites
          </a>
          <a href="/archive" className="nav-link">
            Archive
          </a>
        </nav>

        {/* Right side - Search and User Menu */}
        <div className="header-right">
          <button 
            className="search-button" 
            onClick={() => showComingSoon('Search')}
            aria-label="Search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          <ThemeToggle />

          <button 
            className="add-button" 
            onClick={() => showComingSoon('Quick Add')}
            aria-label="Add article"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <div className="user-menu-container" ref={menuRef}>
            <button
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="user-avatar">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="user-menu-overlay"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <div className="user-avatar large">
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user?.displayName}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>

                  <nav className="user-menu-nav">
                    <div className="user-menu-section-label">Account</div>
                    <button
                      onClick={() => showComingSoon('Profile')}
                      className="user-menu-item"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Profile
                    </button>
                    <button
                      onClick={() => showComingSoon('Settings')}
                      className="user-menu-item"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                      </svg>
                      Settings
                    </button>
                  </nav>

                  <div className="user-menu-divider" />

                  <nav className="user-menu-nav">
                    <div className="user-menu-section-label">Navigation</div>
                    <a href="/dashboard" className="user-menu-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      Dashboard
                    </a>
                    <button onClick={() => showComingSoon('Library')} className="user-menu-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      Library
                    </button>
                    <button onClick={() => showComingSoon('Favorites')} className="user-menu-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Favorites
                    </button>
                    <button onClick={() => showComingSoon('Archive')} className="user-menu-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="21 8 21 21 3 21 3 8" />
                        <rect x="1" y="3" width="22" height="5" />
                        <line x1="10" y1="12" x2="14" y2="12" />
                      </svg>
                      Archive
                    </button>
                  </nav>





                  <div className="user-menu-divider" />

                  <button
                    onClick={handleSignOut}
                    className="user-menu-item danger"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {modalInfo && (
        <InfoModal
          title={modalInfo.title}
          message={modalInfo.message}
          onClose={() => setModalInfo(null)}
        />
      )}
    </header>
  );
}
