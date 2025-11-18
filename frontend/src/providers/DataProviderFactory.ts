/**
 * DataProviderFactory
 *
 * Factory pattern for creating data provider instances.
 * Allows switching between different implementations based on environment.
 */

import { IDataProvider } from './IDataProvider';
import { ApiDataProvider } from './ApiDataProvider';
import { MockDataProvider } from './MockDataProvider';

export enum DataProviderType {
  API = 'api',
  MOCK = 'mock'
}

export class DataProviderFactory {
  private static instance: IDataProvider | null = null;
  private static currentType: DataProviderType = DataProviderType.API;

  /**
   * Get singleton data provider instance
   */
  static getInstance(): IDataProvider {
    if (!this.instance) {
      this.instance = this.createProvider(this.currentType);
    }
    return this.instance;
  }

  /**
   * Set the data provider type (useful for testing)
   */
  static setProviderType(type: DataProviderType): void {
    this.currentType = type;
    this.instance = null; // Reset instance to force recreation
  }

  /**
   * Create a specific provider instance
   */
  private static createProvider(type: DataProviderType): IDataProvider {
    switch (type) {
      case DataProviderType.API:
        // Use VITE_API_URL from env, or fallback to production API in production mode
        const baseUrl = import.meta.env.VITE_API_URL || 
          (import.meta.env.PROD ? 'https://savetoread-api.yeb404974.workers.dev' : '');
        
        return new ApiDataProvider({
          baseUrl,
          timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)
        });

      case DataProviderType.MOCK:
        return new MockDataProvider();

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * Reset the factory (useful for testing)
   */
  static reset(): void {
    this.instance = null;
    this.currentType = DataProviderType.API;
  }
}

/**
 * Convenience hook for accessing data provider
 */
export function useDataProvider(): IDataProvider {
  return DataProviderFactory.getInstance();
}
