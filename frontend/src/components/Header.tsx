/**
 * Header Component
 *
 * Reusable header component for authenticated pages
 */

import { useState } from 'react';
import { LogoIcon } from './Logo';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ onMenuClick, showMenu = false }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Left side - Logo and Menu */}
        <div className="header-left">
          {showMenu && (
            <button
              className="menu-button"
              onClick={onMenuClick}
              aria-label="Toggle menu"
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
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          <a href="/" className="header-logo">
            <LogoIcon size={32} className="text-orange-500" />
            <span className="header-logo-text">SaveToRead</span>
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
          <button className="search-button" aria-label="Search">
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

          <button className="add-button" aria-label="Add article">
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

          <div className="user-menu-container">
            <button
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User menu"
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

                  <div className="user-menu-divider" />

                  <nav className="user-menu-nav">
                    <a href="/settings" className="user-menu-item">
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
                    </a>
                    <a href="/storage" className="user-menu-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                      Cloud Storage
                    </a>
                    <a href="/billing" className="user-menu-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      Billing
                    </a>
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
    </header>
  );
}
