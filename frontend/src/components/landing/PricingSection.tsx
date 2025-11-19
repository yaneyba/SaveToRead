/**
 * Pricing Section Component
 *
 * Displays pricing plans for SaveToRead
 */

interface PricingSectionProps {
  onSignUpClick: () => void;
}

export function PricingSection({ onSignUpClick }: PricingSectionProps) {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      features: [
        { text: 'Save unlimited articles', included: true },
        { text: 'Read on all devices', included: true },
        { text: 'Tags and search', included: true },
        { text: 'Basic highlights', included: true },
        { text: 'Cloud storage sync', included: false },
        { text: 'PDF snapshots', included: false }
      ],
      cta: 'Get Started',
      featured: false
    },
    {
      name: 'Premium',
      price: '$5',
      period: '/month',
      badge: 'Most Popular',
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'Cloud storage sync (Drive, Dropbox, OneDrive)', included: true },
        { text: 'PDF & HTML snapshots', included: true },
        { text: 'Advanced annotations', included: true },
        { text: 'Reading analytics', included: true },
        { text: 'Priority support', included: true }
      ],
      cta: 'Start Free Trial',
      featured: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        { text: 'Everything in Premium', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'Advanced security (SSO, SAML)', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'SLA guarantee', included: true }
      ],
      cta: 'Contact Sales',
      featured: false
    }
  ];

  return (
    <section className="pricing">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-description">
            Choose the plan that's right for you. Cancel anytime.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
              {plan.badge && <div className="pricing-badge">{plan.badge}</div>}

              <div className="pricing-header">
                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-price">
                  <span className="price-amount">{plan.price}</span>
                  {plan.period && <span className="price-period">{plan.period}</span>}
                </div>
              </div>

              <ul className="pricing-features">
                {plan.features.map((feature, index) => (
                  <li key={index} className={`feature-item ${!feature.included ? 'disabled' : ''}`}>
                    <span className="feature-check">{feature.included ? '✓' : '✗'}</span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={plan.cta === 'Contact Sales' ? undefined : onSignUpClick}
                className={`btn-pricing ${plan.featured ? 'primary' : ''}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
