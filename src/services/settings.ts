import { supabase } from '../lib/supabase';
import type { StoreSettings } from '../lib/types';

/** Valores por defecto si la tabla store_settings no existe o está vacía. */
export const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  require_cedula: true,
  require_rif: false,
  enable_2fa: false,
  fuel_price: 125,
  vehicle_kml: 8,
  shipping_margin: 0.3,
  round_trip: true,
  updated_at: '',
};

/**
 * Lee la configuración global de la tienda. Si la tabla no existe todavía
 * (por ejemplo, no se ha corrido la migración), devuelve los valores por
 * defecto para que la app siga funcionando.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;
  return data as StoreSettings;
}

/** Actualiza la configuración (solo admins, según RLS). */
export async function updateStoreSettings(fields: Partial<StoreSettings>): Promise<void> {
  const { error } = await supabase
    .from('store_settings')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw error;
}

/**
 * Calcula el costo de envío sugerido según la distancia y los parámetros de
 * gasolina configurados. Fórmula:
 *   costo = (km × (ida y vuelta ? 2 : 1) ÷ km_por_litro) × precio_litro × (1 + margen)
 */
export function estimateShippingCost(distanceKm: number, settings: StoreSettings): number {
  if (distanceKm <= 0 || settings.vehicle_kml <= 0) return 0;
  const totalKm = distanceKm * (settings.round_trip ? 2 : 1);
  const liters = totalKm / settings.vehicle_kml;
  const fuelCost = liters * settings.fuel_price;
  return fuelCost * (1 + settings.shipping_margin);
}
