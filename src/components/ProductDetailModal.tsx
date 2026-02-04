import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Product, Inventory } from '../lib/supabase';

interface ProductDetailModalProps {
  product: Product | null;
  inventory: Inventory | undefined;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({ product, inventory, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const inStock = inventory && inventory.quantity > 0;
  const stockCount = inventory?.quantity || 0;
  const maxQuantity = Math.min(stockCount, 99);

  const handleAddToCart = () => {
    if (inStock) {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl w-full max-w-4xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-amber-500/20">
          <h2 className="text-2xl font-bold text-white">Detalle del Producto</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-700 rounded" />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white mb-4">{product.name}</h3>

                <div className="mb-4">
                  {inStock ? (
                    <span className="inline-flex items-center gap-2 bg-emerald-400/10 text-emerald-400 px-3 py-1 rounded-lg text-sm font-medium">
                      En stock: {stockCount} disponibles
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-red-400/10 text-red-400 px-3 py-1 rounded-lg text-sm font-medium">
                      Sin stock
                    </span>
                  )}
                </div>

                <p className="text-slate-300 mb-6 leading-relaxed">{product.description}</p>

                <div className="bg-slate-900/50 border border-amber-500/20 rounded-lg p-4 mb-6">
                  <p className="text-slate-400 text-sm mb-1">Precio</p>
                  <p className="text-amber-400 text-4xl font-bold">${product.price.toFixed(2)}</p>
                  <p className="text-slate-500 text-sm mt-2">SKU: {product.sku}</p>
                </div>

                {inStock && (
                  <div className="mb-6">
                    <p className="text-slate-400 text-sm mb-3">Cantidad</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-2">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="text-slate-400 hover:text-white transition-colors p-2"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-white font-bold text-xl w-12 text-center">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                          className="text-slate-400 hover:text-white transition-colors p-2"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                  inStock
                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg hover:shadow-orange-500/50'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
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
