/**
 * Features Section Component
 *
 * Displays key features of SaveToRead
 */

export function FeaturesSection() {
  const features = [
    {
      icon: '🔗',
      title: 'Save from Anywhere',
      description: 'Browser extension, mobile app, or simply paste a URL. Save articles from any website instantly.'
    },
    {
      icon: '☁️',
      title: 'Your Cloud, Your Choice',
      description: 'Link your Google Drive, Dropbox, or OneDrive. We never store your articles—you own your data.'
    },
    {
      icon: '✍️',
      title: 'Highlight & Annotate',
      description: 'Mark important passages, add notes, and organize your thoughts as you read.'
    },
    {
      icon: '📄',
      title: 'PDF & HTML Snapshots',
      description: 'Create permanent snapshots of articles saved directly to your cloud storage.'
    },
    {
      icon: '🔍',
      title: 'Smart Organization',
      description: 'Tag, favorite, archive, and search through your library with powerful filters.'
    },
    {
      icon: '📱',
      title: 'Sync Everywhere',
      description: 'Start reading on your phone, continue on your laptop. Progress syncs seamlessly.'
    }
  ];

  return (
    <section className="features">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Read Better</h2>
          <p className="section-description">
            A complete reading experience with the privacy and control you deserve
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
