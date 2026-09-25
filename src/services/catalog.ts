import { supabase } from '../lib/supabase';
import type { Category, Inventory, Product } from '../lib/types';

export interface CatalogData {
  categories: Category[];
  products: Product[];
  featured: Product[];
  inventory: Inventory[];
}

/**
 * Carga todos los datos del catálogo en paralelo.
 * Si no hay productos destacados explícitos, usa los primeros productos activos.
 */
export async function fetchCatalog(featuredLimit = 10): Promise<CatalogData> {
  const [categoriesRes, productsRes, featuredRes, inventoryRes] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('products').select('*').eq('is_active', true).order('name'),
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(featuredLimit),
    supabase.from('inventory').select('*'),
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (productsRes.error) throw productsRes.error;
  if (inventoryRes.error) throw inventoryRes.error;

  const products = productsRes.data ?? [];
  const featured =
    !featuredRes.error && featuredRes.data && featuredRes.data.length > 0
      ? featuredRes.data
      : products.slice(0, featuredLimit);

  return {
    categories: categoriesRes.data ?? [],
    products,
    featured,
    inventory: inventoryRes.data ?? [],
  };
}
