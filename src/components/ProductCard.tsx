import { Plus, Package } from 'lucide-react';
import { Product, Inventory } from '../lib/supabase';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface ProductCardProps {
  product: Product;
  inventory: Inventory | undefined;
  onAddToCart: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  priority?: boolean;
}

export function ProductCard({ product, inventory, onAddToCart, onProductClick, priority = false }: ProductCardProps) {
  const inStock = inventory && inventory.quantity > 0;
  const stockCount = inventory?.quantity || 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-lg sm:rounded-xl overflow-hidden hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/10 group flex flex-col h-full">
      <div
        className="h-40 sm:h-56 lg:h-[280px] bg-slate-900/50 flex items-center justify-center overflow-hidden relative cursor-pointer flex-shrink-0"
        onClick={() => onProductClick?.(product)}
      >
        {product.image_url ? (
          <ImageWithSkeleton
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <Package className="w-12 h-12 sm:w-20 sm:h-20 text-slate-700" />
        )}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-slate-900/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded z-10">
          {inStock ? (
            <span className="text-[10px] sm:text-xs text-emerald-400 font-medium">{stockCount} disponibles</span>
          ) : (
            <span className="text-[10px] sm:text-xs text-red-400 font-medium">Sin stock</span>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2 line-clamp-2 flex-shrink-0">
          {product.name}
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 flex-1">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-amber-400 text-lg sm:text-xl lg:text-2xl font-bold">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">SKU: {product.sku}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={!inStock}
            className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all text-sm ${
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
