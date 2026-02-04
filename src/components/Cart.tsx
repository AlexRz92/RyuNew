import { X, Trash2, Plus, Minus } from 'lucide-react';
import { Product } from '../lib/supabase';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, onCheckout }: CartProps) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col border-l border-amber-500/20">
        <div className="flex items-center justify-between p-6 border-b border-amber-500/20">
          <h2 className="text-2xl font-bold text-white">Carrito</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="bg-slate-800/50 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-slate-700 rounded" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold mb-1 truncate">{item.product.name}</h3>
                      <p className="text-amber-400 font-bold mb-2">${item.product.price.toFixed(2)}</p>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
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
          <div className="border-t border-amber-500/20 p-6 bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-lg">Total</span>
              <span className="text-amber-400 text-3xl font-bold">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50"
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
