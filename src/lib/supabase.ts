import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  sku: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  tracking_code: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  payment_method: string;
  payment_proof_url: string | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface CustomerProfile {
  id: string;
  first_name: string;
  last_name: string;
  cedula: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingRule {
  id: string;
  country: string;
  state: string;
  city: string;
  is_free: boolean;
  base_cost: number;
  cost_per_km: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
