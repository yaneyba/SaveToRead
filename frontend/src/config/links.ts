/**
 * Shared Links Configuration
 *
 * Centralized configuration for all external and internal links
 * used across the application
 */

export type LinkConfig = {
  label: string;
  href: string;
  external: boolean;
};

export type SocialLinkConfig = {
  label: string;
  href: string;
  icon: 'github';
};

export const LINKS = {
  // External links
  github: {
    repo: 'https://github.com/yaneyba/savetoread',
    issues: 'https://github.com/yaneyba/savetoread/issues',
  },

  // Internal links
  privacy: '/privacy',
  terms: '/terms',
} as const;

// Link metadata for easier rendering
export const FOOTER_LINKS = {
  resources: [
    {
      label: 'Support',
      href: LINKS.github.issues,
      external: true,
    },
  ] as const satisfies readonly LinkConfig[],
  legal: [
    {
      label: 'Privacy',
      href: LINKS.privacy,
      external: false,
    },
    {
      label: 'Terms',
      href: LINKS.terms,
      external: false,
    },
  ] as const satisfies readonly LinkConfig[],
} as const;

export const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: LINKS.github.repo,
    icon: 'github' as const,
  },
] as const satisfies readonly SocialLinkConfig[];

// Footer branding content
export const FOOTER_CONTENT = {
  description: 'Your personal reading library, stored in your own cloud storage.',
} as const;
