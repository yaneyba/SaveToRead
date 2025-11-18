/**
 * Info Modal Component
 *
 * A reusable modal for displaying informational messages
 * that matches the site's design system
 */

interface InfoModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

export function InfoModal({ title, message, onClose }: InfoModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content info-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px' }}
      >
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2 className="modal-title" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            {title}
          </h2>
          <p className="modal-subtitle" style={{ fontSize: '1rem' }}>
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="btn-submit"
          style={{ marginTop: '1.5rem' }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
