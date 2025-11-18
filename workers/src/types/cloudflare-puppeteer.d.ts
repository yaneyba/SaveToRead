/**
 * Type declarations for @cloudflare/puppeteer
 * This module is provided by Cloudflare Workers runtime, not npm
 */

declare module '@cloudflare/puppeteer' {
  interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  interface Page {
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

  interface PuppeteerModule {
    launch(browserBinding: unknown): Promise<Browser>;
  }

  const puppeteer: PuppeteerModule;
  export default puppeteer;

  export { Browser, Page };
}
