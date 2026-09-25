import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../lib/types';
import { calculateTotals, formatCurrency, formatPrice } from '../lib/format';
import { storeConfig } from '../config/store.config';
import { ImageWithSkeleton } from './ImageWithSkeleton';

export type { CartItem } from '../lib/types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function Cart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const { tax, total } = calculateTotals(subtotal);
  const taxPercent = Math.round(storeConfig.finance.taxRate * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg w-full max-w-md h-full shadow-2xl flex flex-col border-l border-line">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 className="text-xl font-bold text-content flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand" />
            Carrito
          </h2>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('¿Vaciar el carrito? Se quitarán todos los productos.')) {
                    onClearCart();
                  }
                }}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors px-3 py-1.5 rounded-full"
              >
                <Trash2 className="w-4 h-4" />
                Vaciar
              </button>
            )}
            <button
              onClick={onClose}
              className="text-content-muted hover:text-content transition-colors p-2 hover:bg-surface-hover rounded-full"
              aria-label="Cerrar carrito"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-content-muted mx-auto mb-3" />
              <p className="text-content-muted">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="bg-surface border border-line rounded-2xl p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-bg-subtle rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.product.image_url ? (
                        <ImageWithSkeleton
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          preset="cartThumbnail"
                          priority={false}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-bg-subtle rounded" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-content font-semibold mb-1 truncate">{item.product.name}</h3>
                      <p className="text-content font-bold mb-2">{formatPrice(item.product.price)}</p>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-bg-subtle rounded-full p-1">
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                            }
                            className="text-content-soft hover:text-content transition-colors p-1"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-content font-semibold w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="text-content-soft hover:text-content transition-colors p-1"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-red-500 hover:text-red-400 transition-colors p-1"
                          aria-label="Eliminar del carrito"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line p-6 bg-bg space-y-4">
            <div className="space-y-2 pb-4 border-b border-line">
              <div className="flex justify-between text-sm">
                <span className="text-content-muted">Subtotal</span>
                <span className="text-content font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-content-muted">
                  {storeConfig.finance.taxLabel} ({taxPercent}%)
                </span>
                <span className="text-content font-semibold">{formatCurrency(tax)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-content font-bold text-lg">Total</span>
              <span className="text-content text-2xl font-bold tracking-tight">{formatCurrency(total)}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-brand hover:bg-brand-hover text-brand-contrast font-bold py-3.5 rounded-full transition-all shadow-sm"
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
