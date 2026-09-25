/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  // Identidad del negocio (opcionales)
  readonly VITE_STORE_NAME?: string;
  readonly VITE_STORE_TAGLINE?: string;
  readonly VITE_STORE_DESCRIPTION?: string;
  readonly VITE_STORE_LOGO?: string;
  readonly VITE_STORE_LOGO_TEXT?: string;
  readonly VITE_STORE_FAVICON?: string;
  readonly VITE_STORE_OG_IMAGE?: string;
  readonly VITE_STORE_CURRENCY_SYMBOL?: string;
  readonly VITE_STORE_CURRENCY_CODE?: string;
  readonly VITE_STORE_LOCALE?: string;
  readonly VITE_STORE_TAX_RATE?: string;
  readonly VITE_STORE_TAX_LABEL?: string;
  readonly VITE_STORE_CATALOG_TITLE?: string;
  readonly VITE_STORE_FEATURED_TITLE?: string;
  readonly VITE_STORE_EMPTY_CATALOG?: string;
  readonly VITE_STORE_WHATSAPP?: string;
  readonly VITE_STORE_INSTAGRAM?: string;
  readonly VITE_STORE_EMAIL?: string;
  readonly VITE_STORE_PRODUCTS_PER_PAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
