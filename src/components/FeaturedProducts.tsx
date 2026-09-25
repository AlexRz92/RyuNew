import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import type { Product, Inventory } from '../lib/types';
import { formatPrice } from '../lib/format';
import { storeConfig } from '../config/store.config';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface FeaturedProductsProps {
  products: Product[];
  inventory: Inventory[];
  onProductClick: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export function FeaturedProducts({
  products,
  inventory,
  onProductClick,
  onAddToCart,
}: FeaturedProductsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const cardWidth = 210;
  const gap = 16;

  if (products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('featured-scroll');
    if (!container) return;
    const scrollAmount = direction === 'left' ? -(cardWidth + gap) : cardWidth + gap;
    const newPosition = scrollPosition + scrollAmount;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const clampedPosition = Math.max(0, Math.min(newPosition, maxScroll));
    setScrollPosition(clampedPosition);
    container.scrollTo({ left: clampedPosition, behavior: 'smooth' });
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < products.length * (cardWidth + gap) - 1000;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-content tracking-tight">
          {storeConfig.content.featuredTitle}
        </h2>
        <div className="hidden lg:flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-9 h-9 rounded-full border border-line bg-surface text-content-soft hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-9 h-9 rounded-full border border-line bg-surface text-content-soft hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        id="featured-scroll"
        className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
      >
        {products.map((product, index) => {
          const productInventory = inventory.find((inv) => inv.product_id === product.id);
          const inStock = productInventory !== undefined && productInventory.quantity > 0;
          const stockCount = productInventory?.quantity ?? 0;

          return (
            <div
              key={product.id}
              onClick={() => onProductClick(product)}
              className="group flex-shrink-0 w-[150px] sm:w-[190px] lg:w-[210px] bg-surface border border-line rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer"
            >
              <div className="aspect-square bg-bg-subtle flex items-center justify-center overflow-hidden relative">
                {product.image_url ? (
                  <ImageWithSkeleton
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    priority={index < 3}
                    preset="featuredProduct"
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

              <div className="p-3 sm:p-4 flex flex-col">
                <h3 className="text-content font-semibold text-sm sm:text-base mb-1 line-clamp-2 flex-shrink-0">
                  {product.name}
                </h3>
                <p className="text-content-muted text-xs sm:text-sm mb-3 line-clamp-2 flex-1">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mt-auto gap-2">
                  <p className="text-content text-lg sm:text-2xl font-bold tracking-tight">
                    {formatPrice(product.price)}
                  </p>
                  {onAddToCart && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (inStock) onAddToCart(product);
                      }}
                      disabled={!inStock}
                      className={`font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all text-xs sm:text-sm flex items-center justify-center ${
                        inStock
                          ? 'bg-brand hover:bg-brand-hover text-brand-contrast'
                          : 'bg-bg-subtle text-content-muted cursor-not-allowed'
                      }`}
                    >
                      Agregar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
