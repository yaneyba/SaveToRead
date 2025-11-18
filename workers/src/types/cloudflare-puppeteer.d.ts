/**
 * Type declarations for @cloudflare/puppeteer
 * This module is provided by Cloudflare Workers runtime, not npm
 */

declare module '@cloudflare/puppeteer' {
  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Page {
    goto(url: string, options?: {
      waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
      timeout?: number;
    }): Promise<void>;

    pdf(options?: {
      format?: string;
      printBackground?: boolean;
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
    }): Promise<ArrayBuffer>;

    addStyleTag(options: { content: string }): Promise<void>;

    content(): Promise<string>;

    evaluate<T>(pageFunction: () => T | Promise<T>): Promise<T>;

    close(): Promise<void>;
  }

  export interface PuppeteerLaunchOptions {
    headless?: boolean;
    args?: string[];
  }

  export function launch(browserBinding: unknown): Promise<Browser>;

  const puppeteer: {
    launch: (browserBinding: unknown) => Promise<Browser>;
  };

  export default puppeteer;
}

// Also export types directly for local imports
export interface Browser {
  newPage(): Promise<Page>;
  close(): Promise<void>;
}

export interface Page {
  goto(url: string, options?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
    timeout?: number;
  }): Promise<void>;

  pdf(options?: {
    format?: string;
    printBackground?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    }): Promise<ArrayBuffer>;

  addStyleTag(options: { content: string }): Promise<void>;

  content(): Promise<string>;

  evaluate<T>(pageFunction: () => T | Promise<T>): Promise<T>;

  close(): Promise<void>;
}
