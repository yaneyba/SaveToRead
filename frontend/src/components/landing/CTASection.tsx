/**
 * CTA Section Component
 *
 * Call-to-action section for the landing page
 */

interface CTASectionProps {
  onSignUpClick: () => void;
}

export function CTASection({ onSignUpClick }: CTASectionProps) {
  return (
    <section className="cta">
      <div className="container">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Build Your Reading Library?</h2>
          <p className="cta-description">
            Join thousands of readers who trust SaveToRead to organize and preserve their favorite content.
          </p>
          <button onClick={onSignUpClick} className="btn-cta">
            Start Reading Free
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
