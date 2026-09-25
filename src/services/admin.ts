import { supabase } from '../lib/supabase';
import type {
  AdminUser,
  BankAccount,
  Category,
  Inventory,
  Order,
  OrderStatus,
  Product,
  ShippingRule,
} from '../lib/types';

/**
 * Comprueba si el usuario actual es administrador, usando la función
 * `is_admin(p_uid)` definida en la base de datos.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin', { p_uid: userId });
  if (error) {
    // Fallback: consulta directa a admin_users si la RPC no está disponible.
    const { data: row } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('user_id', userId)
      .maybeSingle();
    return Boolean(row?.is_active);
  }
  return Boolean(data);
}

/* ------------------------------- Productos ------------------------------- */

export async function adminListProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateProduct(product: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(product).select().single();
  if (error) throw error;
  return data;
}

export async function adminUpdateProduct(id: string, fields: Partial<Product>): Promise<void> {
  const { error } = await supabase.from('products').update(fields).eq('id', id);
  if (error) throw error;
}

export async function adminDeleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------- Inventario ------------------------------ */

export async function adminListInventory(): Promise<Inventory[]> {
  const { data, error } = await supabase.from('inventory').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function adminSetStock(productId: string, quantity: number): Promise<void> {
  // upsert por si aún no existe fila de inventario para el producto.
  const { error } = await supabase
    .from('inventory')
    .upsert({ product_id: productId, quantity }, { onConflict: 'product_id' });
  if (error) throw error;
}

/* ------------------------------- Categorías ------------------------------ */

export async function adminListCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateCategory(category: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(category).select().single();
  if (error) throw error;
  return data;
}

export async function adminUpdateCategory(id: string, fields: Partial<Category>): Promise<void> {
  const { error } = await supabase.from('categories').update(fields).eq('id', id);
  if (error) throw error;
}

export async function adminDeleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

/* -------------------------------- Pedidos -------------------------------- */

export async function adminListOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function adminUpdateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

/* ---------------------------- Reglas de envío ---------------------------- */

export async function adminListShippingRules(): Promise<ShippingRule[]> {
  const { data, error } = await supabase
    .from('shipping_rules')
    .select('*')
    .order('state')
    .order('city');
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateShippingRule(rule: Partial<ShippingRule>): Promise<ShippingRule> {
  const { data, error } = await supabase.from('shipping_rules').insert(rule).select().single();
  if (error) throw error;
  return data;
}

export async function adminUpdateShippingRule(id: string, fields: Partial<ShippingRule>): Promise<void> {
  const { error } = await supabase.from('shipping_rules').update(fields).eq('id', id);
  if (error) throw error;
}

export async function adminDeleteShippingRule(id: string): Promise<void> {
  const { error } = await supabase.from('shipping_rules').delete().eq('id', id);
  if (error) throw error;
}

/* --------------------------- Cuentas bancarias --------------------------- */

export async function adminListBankAccounts(): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateBankAccount(account: Partial<BankAccount>): Promise<BankAccount> {
  const { data, error } = await supabase.from('bank_accounts').insert(account).select().single();
  if (error) throw error;
  return data;
}

export async function adminUpdateBankAccount(id: string, fields: Partial<BankAccount>): Promise<void> {
  const { error } = await supabase.from('bank_accounts').update(fields).eq('id', id);
  if (error) throw error;
}

export async function adminDeleteBankAccount(id: string): Promise<void> {
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
  if (error) throw error;
}

/* -------------------------- Usuarios administradores --------------------- */

export async function adminListAdmins(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function adminSetAdminActive(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('admin_users').update({ is_active: isActive }).eq('user_id', userId);
  if (error) throw error;
}
