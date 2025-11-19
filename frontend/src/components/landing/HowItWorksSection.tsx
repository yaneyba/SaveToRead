/**
 * How It Works Section Component
 *
 * Explains the steps to get started with SaveToRead
 */

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: 'Create Your Account',
      description: 'Sign up with your email—no credit card required to start.'
    },
    {
      number: 2,
      title: 'Link Your Cloud Storage',
      description: 'Connect Google Drive, Dropbox, or OneDrive in one click.'
    },
    {
      number: 3,
      title: 'Start Saving Articles',
      description: 'Add articles via URL, browser extension, or mobile app.'
    },
    {
      number: 4,
      title: 'Read Anywhere',
      description: 'Your reading list syncs across all your devices automatically.'
    }
  ];

  return (
    <section className="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-description">
            Get started in minutes, not hours
          </p>
        </div>

        <div className="steps">
          {steps.map((step) => (
            <div key={step.number} className="step">
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
