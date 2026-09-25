/**
 * ============================================================================
 *  CONFIGURACIÓN DE LA TIENDA (PLANTILLA GENÉRICA / WHITE-LABEL)
 * ============================================================================
 *
 * Este es el ÚNICO archivo que necesitas tocar para adaptar esta plantilla
 * a un negocio distinto (ferretería, licorería, abasto, pizzería, etc.).
 *
 * Puedes cambiar los valores aquí directamente, o sobrescribirlos con
 * variables de entorno (VITE_STORE_*) sin tocar el código —útil para tener
 * el mismo repo desplegado como varios negocios distintos en Vercel—.
 *
 * NOTA: las variables VITE_* se incrustan en el build. Para que un cambio
 * tenga efecto en producción hay que volver a desplegar.
 * ============================================================================
 */

/** Toma una variable de entorno VITE_* y, si no existe, usa el valor por defecto. */
function env(key: string, fallback: string): string {
  const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
  return value !== undefined && value !== '' ? value : fallback;
}

/** Convierte una variable de entorno a número, con fallback. */
function envNumber(key: string, fallback: number): number {
  const raw = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface StoreConfig {
  /** Nombre corto del negocio (aparece en el header, título, factura). */
  name: string;
  /** Eslogan o descripción corta. */
  tagline: string;
  /** Descripción larga para SEO / meta tags. */
  description: string;

  /** Rutas a los assets de marca (dentro de /public). */
  branding: {
    /** Logo principal (isotipo). */
    logo: string;
    /** Logo secundario / texto de marca (opcional; deja '' para ocultarlo). */
    logoText: string;
    /** Favicon. */
    favicon: string;
    /** Imagen para compartir en redes (Open Graph). */
    ogImage: string;
  };

  /** Configuración financiera. */
  finance: {
    /** Símbolo de moneda mostrado en la UI. */
    currencySymbol: string;
    /** Código ISO de la moneda (para Intl.NumberFormat). */
    currencyCode: string;
    /** Locale usado para formatear precios y fechas. */
    locale: string;
    /**
     * Tasa de impuesto aplicada al subtotal (ej: 0.16 = 16% IVA Venezuela).
     * Pon 0 si tu negocio no aplica impuesto.
     */
    taxRate: number;
    /** Etiqueta del impuesto mostrada en la UI (ej: "IVA"). */
    taxLabel: string;
  };

  /** Textos de la interfaz que dependen del rubro. */
  content: {
    /** Título de la sección principal del catálogo. */
    catalogTitle: string;
    /** Título de la sección de destacados. */
    featuredTitle: string;
    /** Mensaje cuando no hay productos. */
    emptyCatalog: string;
  };

  /** Contacto / enlaces (opcionales; deja '' para ocultar). */
  contact: {
    whatsapp: string;
    instagram: string;
    email: string;
  };

  /** Nº de productos por página en el catálogo. */
  productsPerPage: number;
}

export const storeConfig: StoreConfig = {
  name: env('VITE_STORE_NAME', 'Nova Store'),
  tagline: env('VITE_STORE_TAGLINE', 'Tu tienda en línea'),
  description: env('VITE_STORE_DESCRIPTION', 'Compra fácil, rápido y seguro'),

  branding: {
    // Deja logo vacío para mostrar el nombre como texto (marca genérica).
    // Define VITE_STORE_LOGO con la ruta de tu imagen para usar un logo.
    logo: env('VITE_STORE_LOGO', ''),
    logoText: env('VITE_STORE_LOGO_TEXT', ''),
    favicon: env('VITE_STORE_FAVICON', '/ryu.png'),
    ogImage: env('VITE_STORE_OG_IMAGE', '/og.png'),
  },

  finance: {
    currencySymbol: env('VITE_STORE_CURRENCY_SYMBOL', '$'),
    currencyCode: env('VITE_STORE_CURRENCY_CODE', 'USD'),
    locale: env('VITE_STORE_LOCALE', 'es-VE'),
    // IVA 16% (Venezuela) por defecto. Configurable por entorno.
    taxRate: envNumber('VITE_STORE_TAX_RATE', 0.16),
    taxLabel: env('VITE_STORE_TAX_LABEL', 'IVA'),
  },

  content: {
    catalogTitle: env('VITE_STORE_CATALOG_TITLE', 'Todos los productos'),
    featuredTitle: env('VITE_STORE_FEATURED_TITLE', 'Productos más vendidos'),
    emptyCatalog: env('VITE_STORE_EMPTY_CATALOG', 'No hay productos disponibles'),
  },

  contact: {
    whatsapp: env('VITE_STORE_WHATSAPP', ''),
    instagram: env('VITE_STORE_INSTAGRAM', ''),
    email: env('VITE_STORE_EMAIL', ''),
  },

  productsPerPage: envNumber('VITE_STORE_PRODUCTS_PER_PAGE', 10),
};
