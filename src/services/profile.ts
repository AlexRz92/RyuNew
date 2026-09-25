import { supabase } from '../lib/supabase';
import type { CustomerProfile, Order, OrderItem, Product } from '../lib/types';

/** Obtiene el perfil de un usuario (o null si no existe). */
export async function getProfile(userId: string): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Crea o actualiza el perfil del usuario. */
export async function upsertProfile(profile: Partial<CustomerProfile> & { id: string }): Promise<void> {
  const { error } = await supabase.from('customer_profiles').upsert(profile, { onConflict: 'id' });
  if (error) throw error;
}

/** Actualiza campos concretos del perfil. */
export async function updateProfile(
  userId: string,
  fields: Partial<CustomerProfile>
): Promise<void> {
  const { error } = await supabase.from('customer_profiles').update(fields).eq('id', userId);
  if (error) throw error;
}

/** Lista los pedidos de un usuario, más recientes primero. */
export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Obtiene los items de un pedido. */
export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (error) throw error;
  return data ?? [];
}

/** Dado un pedido, obtiene los productos activos correspondientes para recompra. */
export async function getActiveProductsByIds(productIds: string[]): Promise<Product[]> {
  if (productIds.length === 0) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('is_active', true);

  if (error) throw error;
  return data ?? [];
}
