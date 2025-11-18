/**
 * Footer Component
 *
 * Reusable footer component for all pages
 */

import { LogoWordmark } from '@/components/Logo';
import { SocialIcon } from '@/components/SocialIcon';
import { FOOTER_LINKS, SOCIAL_LINKS, FOOTER_CONTENT } from '@/config/links';

interface FooterProps {
  variant?: 'default' | 'minimal';
}

export function Footer({ variant = 'default' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className="footer-minimal">
        <div className="footer-minimal-content">
          <p className="footer-copyright">
            © {currentYear} SaveToRead. All rights reserved.
          </p>
          <div className="footer-minimal-links">
            {FOOTER_LINKS.legal.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section footer-brand">
            <LogoWordmark size={28} className="footer-logo" textColor="#111827" iconColor="#111827" />
            <p className="footer-description">
              {FOOTER_CONTENT.description}
            </p>
            <div className="footer-social">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="social-link"
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon icon={link.icon} size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Resources Links */}
          <div className="footer-section">
            <h4 className="footer-title">Resources</h4>
            <ul className="footer-links">
              {FOOTER_LINKS.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} SaveToRead. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            {FOOTER_LINKS.legal.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
