import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import type { Product, Inventory } from '../lib/types';
import { formatPrice } from '../lib/format';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface ProductDetailModalProps {
  product: Product | null;
  inventory: Inventory | undefined;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({ product, inventory, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const inStock = inventory !== undefined && inventory.quantity > 0;
  const stockCount = inventory?.quantity ?? 0;
  const maxQuantity = Math.min(stockCount, 99);

  const handleAddToCart = () => {
    if (inStock) {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-bg-elevated border border-line rounded-2xl w-full max-w-4xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="text-lg font-bold text-content">Detalle del Producto</h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content transition-colors p-2 hover:bg-surface-hover rounded-full"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-bg-subtle rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
              {product.image_url ? (
                <ImageWithSkeleton
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  priority={true}
                  preset="productDetail"
                />
              ) : (
                <div className="w-32 h-32 bg-bg-subtle rounded" />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-bold text-content mb-4 tracking-tight">
                  {product.name}
                </h3>

                <div className="mb-4">
                  {inStock ? (
                    <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                      En stock: {stockCount} disponibles
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-sm font-medium">
                      Sin stock
                    </span>
                  )}
                </div>

                <p className="text-content-soft mb-6 leading-relaxed">{product.description}</p>

                <div className="bg-bg-subtle border border-line rounded-2xl p-4 mb-6">
                  <p className="text-content-muted text-sm mb-1">Precio</p>
                  <p className="text-content text-4xl font-bold tracking-tight">
                    {formatPrice(product.price)}
                  </p>
                  <p className="text-content-muted text-sm mt-2">SKU: {product.sku}</p>
                </div>

                {inStock && (
                  <div className="mb-6">
                    <p className="text-content-muted text-sm mb-3">Cantidad</p>
                    <div className="flex items-center gap-3 bg-bg-subtle rounded-full p-2 w-fit">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-content-soft hover:text-content transition-colors p-2"
                        aria-label="Disminuir"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-content font-bold text-xl w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        className="text-content-soft hover:text-content transition-colors p-2"
                        aria-label="Aumentar"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full font-bold text-lg transition-all ${
                  inStock
                    ? 'bg-brand hover:bg-brand-hover text-brand-contrast shadow-sm'
                    : 'bg-bg-subtle text-content-muted cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-6 h-6" />
                {inStock ? 'Agregar al Carrito' : 'Producto Agotado'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
