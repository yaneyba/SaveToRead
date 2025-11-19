/**
 * Modal Component Usage Examples
 * 
 * This file demonstrates various use cases for the reusable Modal component
 */

import { useState } from 'react';
import { Modal, ModalActions, ModalButton } from './Modal';

// Example 1: Simple Info Modal
export function InfoModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Show Info</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Welcome to SaveToRead"
        subtitle="Your personal reading library in the cloud"
        type="info"
        size="md"
      >
        <p>Save articles, create snapshots, and store everything in your own cloud storage.</p>
        
        <ModalActions align="center">
          <ModalButton variant="primary" onClick={() => setIsOpen(false)}>
            Got it
          </ModalButton>
        </ModalActions>
      </Modal>
    </>
  );
}

// Example 2: Success Confirmation
export function SuccessModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Show Success</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Article Saved!"
        subtitle="Your article has been added to your library"
        type="success"
        size="sm"
      >
        <ModalActions align="center">
          <ModalButton variant="primary" onClick={() => setIsOpen(false)}>
            Continue
          </ModalButton>
        </ModalActions>
      </Modal>
    </>
  );
}

// Example 3: Warning/Confirmation
export function WarningModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    console.log('Action confirmed');
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Show Warning</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Are you sure?"
        subtitle="This action requires your confirmation"
        type="warning"
        size="sm"
      >
        <ModalActions align="space-between">
          <ModalButton variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </ModalButton>
          <ModalButton variant="primary" onClick={handleConfirm}>
            Confirm
          </ModalButton>
        </ModalActions>
      </Modal>
    </>
  );
}

// Example 4: Danger/Delete Confirmation (like in Dashboard)
export function DangerModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    console.log('Item deleted');
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete Item</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete Article?"
        subtitle="This action cannot be undone. The article will be permanently removed."
        type="danger"
        size="sm"
      >
        <ModalActions align="space-between">
          <ModalButton variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </ModalButton>
          <ModalButton variant="danger" onClick={handleDelete}>
            Delete
          </ModalButton>
        </ModalActions>
      </Modal>
    </>
  );
}

// Example 5: Modal with Custom Content (form, list, etc.)
export function CustomContentModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email:', email);
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Subscribe</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Subscribe to Updates"
        subtitle="Get notified about new features and improvements"
        type="default"
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <ModalActions align="right">
            <ModalButton 
              type="button"
              variant="secondary" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </ModalButton>
            <ModalButton type="submit" variant="primary">
              Subscribe
            </ModalButton>
          </ModalActions>
        </form>
      </Modal>
    </>
  );
}

// Example 6: Modal without close button (requires action)
export function RequiredActionModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Show Required Action</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => {}} // Empty function - user must take action
        title="Action Required"
        subtitle="Please complete this step to continue"
        type="warning"
        size="sm"
        showCloseButton={false}
        closeOnOverlayClick={false}
        closeOnEscape={false}
      >
        <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
          You must verify your email address before you can continue.
        </p>
        
        <ModalActions align="center">
          <ModalButton variant="primary" onClick={() => setIsOpen(false)}>
            Verify Email
          </ModalButton>
        </ModalActions>
      </Modal>
    </>
  );
}

// Example 7: Large modal with custom icon
export function LargeModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const customIcon = (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Show Large Modal</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Cloud Storage Setup"
        subtitle="Choose where to store your articles"
        size="lg"
        icon={customIcon}
      >
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Connect your preferred cloud storage provider to save your articles securely.
          </p>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {['Google Drive', 'Dropbox', 'OneDrive'].map(provider => (
              <button
                key={provider}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        <ModalActions align="right">
          <ModalButton variant="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </ModalButton>
        </ModalActions>
      </Modal>
    </>
  );
}
