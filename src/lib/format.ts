import { storeConfig } from '../config/store.config';

const { locale, currencyCode, currencySymbol, taxRate } = storeConfig.finance;

/**
 * Formatea un monto como moneda usando el locale/código configurados.
 * Si el monto es null/undefined devuelve un guion.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback si el código de moneda no es válido para Intl.
    return `${currencySymbol}${amount.toFixed(2)}`;
  }
}

/** Formato compacto con símbolo (ej: "$12.50"). Útil dentro de tarjetas. */
export function formatPrice(amount: number): string {
  return `${currencySymbol}${amount.toFixed(2)}`;
}

/** Formatea una fecha ISO al locale de la tienda. */
export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string {
  return new Date(iso).toLocaleDateString(locale, options);
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

/**
 * Calcula los totales de un pedido de forma consistente en toda la app.
 * El impuesto se aplica sobre el subtotal según la tasa configurada.
 */
export function calculateTotals(subtotal: number, shipping = 0): OrderTotals {
  const tax = subtotal * taxRate;
  return {
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping,
  };
}
