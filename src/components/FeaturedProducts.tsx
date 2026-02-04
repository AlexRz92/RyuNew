import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Product, Inventory } from '../lib/supabase';

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
    <div className="mb-12">
      <div className="flex items-center justify-center mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <h2 className="text-2xl font-bold text-white px-6">Productos más vendidos</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>

      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/90 hover:bg-slate-800 text-white p-3 rounded-full shadow-xl border border-amber-500/20 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/90 hover:bg-slate-800 text-white p-3 rounded-full shadow-xl border border-amber-500/20 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <div
          id="featured-scroll"
          className="flex gap-6 overflow-x-hidden scroll-smooth pb-4"
        >
          {products.map((product) => {
            const productInventory = inventory.find((inv) => inv.product_id === product.id);
            const inStock = productInventory && productInventory.quantity > 0;
            const stockCount = productInventory?.quantity || 0;

            return (
              <div
                key={product.id}
                onClick={() => onProductClick(product)}
                className="flex-shrink-0 w-[280px] bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl overflow-hidden hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer group/card"
              >
                <div className="h-[280px] bg-slate-900/50 flex items-center justify-center overflow-hidden relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
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

                <div className="p-4 flex flex-col h-[180px]">
                  <h3 className="text-white font-semibold text-base mb-2 line-clamp-2 flex-shrink-0">
                    {product.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2 flex-1">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-amber-400 text-2xl font-bold">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50 text-sm"
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
