/**
 * Hero Section Component
 *
 * Main hero section of the landing page
 */

interface HeroSectionProps {
  onSignUpClick: () => void;
}

export function HeroSection({ onSignUpClick }: HeroSectionProps) {
  return (
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
          <button onClick={onSignUpClick} className="btn-hero-primary">
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
  );
}
