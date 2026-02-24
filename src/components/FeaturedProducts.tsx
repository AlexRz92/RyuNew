import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Product, Inventory } from '../lib/supabase';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface FeaturedProductsProps {
  products: Product[];
  inventory: Inventory[];
  onProductClick: (product: Product) => void;
}

export function FeaturedProducts({ products, inventory, onProductClick }: FeaturedProductsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const cardWidth = 280;
  const gap = 24;

  if (products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('featured-scroll');
    if (!container) return;

    const scrollAmount = direction === 'left' ? -(cardWidth + gap) : (cardWidth + gap);
    const newPosition = scrollPosition + scrollAmount;
    const maxScroll = container.scrollWidth - container.clientWidth;

    const clampedPosition = Math.max(0, Math.min(newPosition, maxScroll));
    setScrollPosition(clampedPosition);
    container.scrollTo({ left: clampedPosition, behavior: 'smooth' });
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < (products.length * (cardWidth + gap) - 1000);

  return (
    <div className="mb-12 overflow-hidden">
      <div className="flex items-center justify-center mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <h2 className="text-xl sm:text-2xl font-bold text-white px-4 sm:px-6 whitespace-nowrap">Productos más vendidos</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>

      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/90 hover:bg-slate-800 text-white p-3 rounded-full shadow-xl border border-amber-500/20 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/90 hover:bg-slate-800 text-white p-3 rounded-full shadow-xl border border-amber-500/20 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <div
          id="featured-scroll"
          className="flex gap-3 sm:gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
        >
          {products.map((product, index) => {
            const productInventory = inventory.find((inv) => inv.product_id === product.id);
            const inStock = productInventory && productInventory.quantity > 0;
            const stockCount = productInventory?.quantity || 0;

            return (
              <div
                key={product.id}
                onClick={() => onProductClick(product)}
                className="flex-shrink-0 w-[160px] sm:w-[240px] lg:w-[280px] bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-lg sm:rounded-xl overflow-hidden hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer group/card"
              >
                <div className="h-40 sm:h-56 lg:h-[280px] bg-slate-900/50 flex items-center justify-center overflow-hidden relative">
                  {product.image_url ? (
                    <ImageWithSkeleton
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                      priority={index < 3}
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

                <div className="p-3 sm:p-4 flex flex-col">
                  <h3 className="text-white font-semibold text-sm sm:text-base mb-1 sm:mb-2 line-clamp-2 flex-shrink-0">
                    {product.name}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 flex-1">
                    {product.description}
                  </p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto gap-2">
                    <div>
                      <p className="text-amber-400 text-lg sm:text-xl lg:text-2xl font-bold">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
