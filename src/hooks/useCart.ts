import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CartItem, Product } from '../lib/types';

const STORAGE_KEY = 'cart_items';

function loadInitial(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Estado del carrito de compras. Persiste en localStorage para sobrevivir
 * recargas de página.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Almacenamiento no disponible; se ignora.
    }
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const replaceCart = useCallback((next: CartItem[]) => {
    setItems(next);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  return {
    items,
    totalItems,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    replaceCart,
    clearCart,
  };
}

export type UseCartReturn = ReturnType<typeof useCart>;
