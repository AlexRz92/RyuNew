import { useCallback, useEffect, useState } from 'react';
import { fetchCatalog } from '../services/catalog';
import { storeConfig } from '../config/store.config';
import type { Category, Inventory, Product } from '../lib/types';

interface CatalogState {
  categories: Category[];
  products: Product[];
  featured: Product[];
  inventory: Inventory[];
  loading: boolean;
  error: string | null;
}

/** Carga el catálogo completo y expone su estado, con función de recarga. */
export function useCatalog() {
  const [state, setState] = useState<CatalogState>({
    categories: [],
    products: [],
    featured: [],
    inventory: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchCatalog(storeConfig.productsPerPage);
      setState({ ...data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Error al cargar el catálogo',
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Devuelve el inventario de un producto concreto. */
  const inventoryFor = useCallback(
    (productId: string): Inventory | undefined =>
      state.inventory.find((inv) => inv.product_id === productId),
    [state.inventory]
  );

  return { ...state, reload: load, inventoryFor };
}
