import { Plus, Package } from 'lucide-react';
import type { Product, Inventory } from '../lib/types';
import { formatPrice } from '../lib/format';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface ProductCardProps {
  product: Product;
  inventory: Inventory | undefined;
  onAddToCart: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  priority?: boolean;
}

export function ProductCard({
  product,
  inventory,
  onAddToCart,
  onProductClick,
  priority = false,
}: ProductCardProps) {
  const inStock = inventory !== undefined && inventory.quantity > 0;
  const stockCount = inventory?.quantity ?? 0;

  return (
    <div className="group bg-surface border border-line rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col h-full">
      <div
        className="aspect-square bg-bg-subtle flex items-center justify-center overflow-hidden relative cursor-pointer flex-shrink-0"
        onClick={() => onProductClick?.(product)}
      >
        {product.image_url ? (
          <ImageWithSkeleton
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            priority={priority}
            preset="productCard"
          />
        ) : (
          <Package className="w-12 h-12 sm:w-20 sm:h-20 text-content-muted" />
        )}
        <div className="absolute top-2 left-2 z-10">
          {inStock ? (
            <span className="text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-sm">
              {stockCount} disponibles
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full bg-red-500/90 text-white backdrop-blur-sm">
              Sin stock
            </span>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Altura fija (2 líneas) en título y descripción para que el bloque de
            precio + botón quede siempre alineado entre todas las tarjetas. */}
        <h3
          className="text-content font-semibold text-sm sm:text-base mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] cursor-pointer hover:text-brand transition-colors"
          onClick={() => onProductClick?.(product)}
        >
          {product.name}
        </h3>
        <p className="text-content-muted text-xs sm:text-sm mb-3 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
          {product.description}
        </p>

        <div className="flex items-end justify-between mt-auto gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-content text-lg sm:text-2xl font-bold tracking-tight">
              {formatPrice(product.price)}
            </p>
            <p className="text-content-muted text-[10px] sm:text-xs mt-0.5 truncate">
              SKU: {product.sku}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={!inStock}
            className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-full font-semibold transition-all text-sm ${
              inStock
                ? 'bg-brand hover:bg-brand-hover text-brand-contrast shadow-sm'
                : 'bg-bg-subtle text-content-muted cursor-not-allowed'
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
