import { Plus, Package } from 'lucide-react';
import { Product, Inventory } from '../lib/supabase';

interface ProductCardProps {
  product: Product;
  inventory: Inventory | undefined;
  onAddToCart: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

export function ProductCard({ product, inventory, onAddToCart, onProductClick }: ProductCardProps) {
  const inStock = inventory && inventory.quantity > 0;
  const stockCount = inventory?.quantity || 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl overflow-hidden hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/10 group flex flex-col h-full">
      <div
        className="h-[280px] bg-slate-900/50 flex items-center justify-center overflow-hidden relative cursor-pointer flex-shrink-0"
        onClick={() => onProductClick?.(product)}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package className="w-20 h-20 text-slate-700" />
        )}
        <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-lg">
          {inStock ? (
            <span className="text-xs text-emerald-400 font-medium">{stockCount} disponibles</span>
          ) : (
            <span className="text-xs text-red-400 font-medium">Sin stock</span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white font-semibold text-base mb-2 line-clamp-2 flex-shrink-0 h-[3rem]">
          {product.name}
        </h3>
        <p className="text-slate-400 text-sm mb-3 line-clamp-2 flex-1 h-[2.5rem]">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-amber-400 text-2xl font-bold">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-slate-500 text-xs mt-1">SKU: {product.sku}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={!inStock}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              inStock
                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg hover:shadow-orange-500/50'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
