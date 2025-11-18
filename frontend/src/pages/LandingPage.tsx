/**
 * Landing Page Component
 *
 * Marketing landing page for SaveToRead SaaS
 */

import { useState } from 'react';
import { SignInModal } from '../components/SignInModal';
import { LogoIcon } from '../components/Logo';
import '../styles/landing.css';

export function LandingPage() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="landing-page">
      {/* Sticky Navigation */}
      <nav className="hero-nav">
        <div className="nav-content">
          <div className="logo">
            <LogoIcon size={32} className="text-orange-500" />
            <span className="logo-text">SaveToRead</span>
          </div>
          <div className="nav-actions">
            <button onClick={() => setShowSignIn(true)} className="btn-text">
              Sign In
            </button>
            <button onClick={() => setShowSignUp(true)} className="btn-primary">
              Get Started
            </button>
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)} 
              className="hamburger-menu"
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="mobile-menu">
            <button onClick={() => { setShowSignIn(true); setShowMobileMenu(false); }} className="mobile-menu-item">
              Sign In
            </button>
            <button onClick={() => { setShowSignUp(true); setShowMobileMenu(false); }} className="mobile-menu-item">
              Get Started
            </button>
            <a href="#features" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>Features</a>
            <a href="#pricing" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>Pricing</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero">

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-text">✨ Save, Read, and Own Your Content</span>
          </div>

          <h1 className="hero-title">
            Your Personal
            <span className="gradient-text"> Reading Library</span>
            <br />
            Stored in Your Cloud
          </h1>

          <p className="hero-description">
            Save articles, create snapshots, and store everything in your own cloud storage.
            Google Drive, Dropbox, or OneDrive—you choose where your data lives.
          </p>

          <div className="hero-actions">
            <button onClick={() => setShowSignUp(true)} className="btn-hero-primary">
              Start Reading Free
              <span className="btn-arrow">→</span>
            </button>
            <button className="btn-hero-secondary">
              Watch Demo
              <span className="play-icon">▶</span>
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">100%</div>
              <div className="stat-label">Your Data</div>
            </div>
            <div className="stat">
              <div className="stat-number">0</div>
              <div className="stat-label">Storage Costs</div>
            </div>
            <div className="stat">
              <div className="stat-number">∞</div>
              <div className="stat-label">Articles</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need to Read Better</h2>
            <p className="section-description">
              A complete reading experience with the privacy and control you deserve
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3 className="feature-title">Save from Anywhere</h3>
              <p className="feature-description">
                Browser extension, mobile app, or simply paste a URL. Save articles from any website instantly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">☁️</div>
              <h3 className="feature-title">Your Cloud, Your Choice</h3>
              <p className="feature-description">
                Link your Google Drive, Dropbox, or OneDrive. We never store your articles—you own your data.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✍️</div>
              <h3 className="feature-title">Highlight & Annotate</h3>
              <p className="feature-description">
                Mark important passages, add notes, and organize your thoughts as you read.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3 className="feature-title">PDF & HTML Snapshots</h3>
              <p className="feature-description">
                Create permanent snapshots of articles saved directly to your cloud storage.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Smart Organization</h3>
              <p className="feature-description">
                Tag, favorite, archive, and search through your library with powerful filters.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Sync Everywhere</h3>
              <p className="feature-description">
                Start reading on your phone, continue on your laptop. Progress syncs seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-description">
              Get started in minutes, not hours
            </p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Create Your Account</h3>
                <p className="step-description">
                  Sign up with your email—no credit card required to start.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Link Your Cloud Storage</h3>
                <p className="step-description">
                  Connect Google Drive, Dropbox, or OneDrive in one click.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Start Saving Articles</h3>
                <p className="step-description">
                  Add articles via URL, browser extension, or mobile app.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Read Anywhere</h3>
                <p className="step-description">
                  Your reading list syncs across all your devices automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-description">
              Choose the plan that's right for you. Cancel anytime.
            </p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-name">Free</h3>
                <div className="pricing-price">
                  <span className="price-amount">$0</span>
                  <span className="price-period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Save unlimited articles</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Read on all devices</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Tags and search</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Basic highlights</span>
                </li>
                <li className="feature-item disabled">
                  <span className="feature-check">✗</span>
                  <span>Cloud storage sync</span>
                </li>
                <li className="feature-item disabled">
                  <span className="feature-check">✗</span>
                  <span>PDF snapshots</span>
                </li>
              </ul>
              <button onClick={() => setShowSignUp(true)} className="btn-pricing">
                Get Started
              </button>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h3 className="pricing-name">Premium</h3>
                <div className="pricing-price">
                  <span className="price-amount">$5</span>
                  <span className="price-period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Everything in Free</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Cloud storage sync (Drive, Dropbox, OneDrive)</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>PDF & HTML snapshots</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Advanced annotations</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Reading analytics</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <button onClick={() => setShowSignUp(true)} className="btn-pricing primary">
                Start Free Trial
              </button>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-name">Enterprise</h3>
                <div className="pricing-price">
                  <span className="price-amount">Custom</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Everything in Premium</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Team collaboration</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Advanced security (SSO, SAML)</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Dedicated support</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>Custom integrations</span>
                </li>
                <li className="feature-item">
                  <span className="feature-check">✓</span>
                  <span>SLA guarantee</span>
                </li>
              </ul>
              <button className="btn-pricing">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Build Your Reading Library?</h2>
            <p className="cta-description">
              Join thousands of readers who trust SaveToRead to organize and preserve their favorite content.
            </p>
            <button onClick={() => setShowSignUp(true)} className="btn-cta">
              Start Reading Free
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <LogoIcon size={28} className="text-orange-500" />
                <span className="logo-text">SaveToRead</span>
              </div>
              <p className="footer-description">
                Your personal reading library, stored in your own cloud.
              </p>
            </div>

            <div className="footer-section">
              <h4 className="footer-title">Product</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#security">Security</a></li>
                <li><a href="#integrations">Integrations</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-title">Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-title">Resources</h4>
              <ul className="footer-links">
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#api">API</a></li>
                <li><a href="#support">Support</a></li>
                <li><a href="#status">Status</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-title">Legal</h4>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy</a></li>
                <li><a href="#terms">Terms</a></li>
                <li><a href="#cookies">Cookies</a></li>
                <li><a href="#gdpr">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2024 SaveToRead. All rights reserved.
            </p>
            <div className="footer-social">
              <a href="#twitter" aria-label="Twitter">𝕏</a>
              <a href="#github" aria-label="GitHub">GitHub</a>
              <a href="#linkedin" aria-label="LinkedIn">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      {showSignUp && <SignInModal mode="signup" onClose={() => setShowSignUp(false)} />}
    </div>
  );
}
