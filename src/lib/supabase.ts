import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. Define VITE_SUPABASE_URL y ' +
      'VITE_SUPABASE_ANON_KEY (en tu archivo .env local y en las variables de ' +
      'entorno de tu proveedor de hosting).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** URL base de las Edge Functions de Supabase. */
export const functionsBaseUrl = `${supabaseUrl}/functions/v1`;

/** La anon key, necesaria como header en llamadas directas a Edge Functions. */
export const supabaseAnonKeyValue = supabaseAnonKey;

// Re-exportamos los tipos del dominio para mantener compatibilidad con imports
// existentes (`import { Product } from '../lib/supabase'`).
export type {
  Category,
  Product,
  Inventory,
  ProductImage,
  Order,
  OrderItem,
  OrderStatus,
  CustomerProfile,
  ShippingRule,
  BankAccount,
  AdminUser,
  CartItem,
} from './types';
