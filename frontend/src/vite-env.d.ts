/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_DROPBOX_CLIENT_ID: string;
  readonly VITE_ONEDRIVE_CLIENT_ID: string;
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_STORAGE_LINKING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
