/**
 * Sign In/Sign Up Modal Component
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/modal.css';

interface SignInModalProps {
  mode?: 'signin' | 'signup';
  onClose: () => void;
}

export function SignInModal({ mode = 'signin', onClose }: SignInModalProps) {
  const { signIn, signUp } = useAuth();
  const [currentMode, setCurrentMode] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (currentMode === 'signin') {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Display name is required');
        }
        await signUp(email, password, displayName);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2 className="modal-title">
            {currentMode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="modal-subtitle">
            {currentMode === 'signin'
              ? 'Sign in to access your reading library'
              : 'Start building your reading library today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {currentMode === 'signup' && (
            <div className="form-group">
              <label htmlFor="displayName" className="form-label">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="form-input"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              minLength={8}
              required
              disabled={loading}
            />
            {currentMode === 'signup' && (
              <p className="form-hint">At least 8 characters</p>
            )}
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Loading...' : currentMode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="modal-divider">
          <span>or</span>
        </div>

        <div className="modal-oauth">
          <button className="btn-oauth google" disabled>
            <span className="oauth-icon">G</span>
            Continue with Google
          </button>
          <button className="btn-oauth github" disabled>
            <span className="oauth-icon">⚡</span>
            Continue with GitHub
          </button>
        </div>

        <div className="modal-footer">
          {currentMode === 'signin' ? (
            <p className="modal-footer-text">
              Don't have an account?{' '}
              <button
                onClick={() => setCurrentMode('signup')}
                className="link-button"
                type="button"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="modal-footer-text">
              Already have an account?{' '}
              <button
                onClick={() => setCurrentMode('signin')}
                className="link-button"
                type="button"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <p className="modal-terms">
          By continuing, you agree to our{' '}
          <a href="#terms">Terms of Service</a> and{' '}
          <a href="#privacy">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
