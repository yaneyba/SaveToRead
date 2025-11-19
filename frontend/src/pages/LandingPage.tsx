/**
 * Landing Page Component
 *
 * Marketing landing page for SaveToRead SaaS
 */

import { useState } from 'react';
import { SignInModal } from '@/components/SignInModal';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import '@/styles/landing.css';

export function LandingPage() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <SEO
        title="SaveToRead - Your Personal Reading Library in Your Cloud"
        description="Save articles, create snapshots, and store everything in your own cloud storage. Google Drive, Dropbox, or OneDrive - you choose where your data lives. 100% privacy, unlimited articles."
        keywords="read later, save articles, cloud storage, google drive, dropbox, onedrive, article reader, reading list, bookmark manager, web clipper, article saver, pocket alternative, instapaper alternative"
        url="https://savetoread.com/"
      />
      <div className="landing-page">
      {/* Sticky Navigation */}
      <nav className="hero-nav">
        <div className="nav-content">
          <Logo />
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
          <>
            <div 
              className="mobile-menu-overlay" 
              onClick={() => setShowMobileMenu(false)}
            />
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
          </>
        )}
      </nav>

      <HeroSection onSignUpClick={() => setShowSignUp(true)} />

      <FeaturesSection />

      <HowItWorksSection />

      <PricingSection onSignUpClick={() => setShowSignUp(true)} />

      <CTASection onSignUpClick={() => setShowSignUp(true)} />

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      {showSignUp && <SignInModal mode="signup" onClose={() => setShowSignUp(false)} />}
    </div>
    </>
  );
}
