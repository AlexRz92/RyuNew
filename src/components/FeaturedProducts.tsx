import { useEffect, useRef } from 'react';
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

/** Velocidad del desplazamiento automático, en píxeles por segundo. */
const AUTO_SCROLL_SPEED = 40;

export function FeaturedProducts({
  products,
  inventory,
  onProductClick,
  onAddToCart,
}: FeaturedProductsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardWidth = 210;
  const gap = 16;
  const step = cardWidth + gap;

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;
    const amount = direction === 'left' ? -step : step;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Auto-desplazamiento CONTINUO y fluido: avanza unos pocos píxeles por frame
  // (sensación de cinta), y al llegar al final vuelve al inicio. Se pausa cuando
  // el usuario pasa el cursor por encima o toca/arrastra el carrusel.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || products.length <= 1) return;

    let paused = false;
    let rafId = 0;
    let lastTime = 0;

    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };

    container.addEventListener('mouseenter', pause);
    container.addEventListener('mouseleave', resume);
    container.addEventListener('touchstart', pause, { passive: true });
    container.addEventListener('touchend', resume);

    const tick = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;

      if (!paused) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 0) {
          const advance = (AUTO_SCROLL_SPEED * delta) / 1000;
          let next = container.scrollLeft + advance;
          // Al llegar (casi) al final, reinicia al principio.
          if (next >= maxScroll - 1) next = 0;
          container.scrollLeft = next;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener('mouseenter', pause);
      container.removeEventListener('mouseleave', resume);
      container.removeEventListener('touchstart', pause);
      container.removeEventListener('touchend', resume);
    };
  }, [products.length]);

  if (products.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-content tracking-tight">
          {storeConfig.content.featuredTitle}
        </h2>
        <div className="hidden lg:flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full border border-line bg-surface text-content-soft hover:bg-surface-hover transition-colors flex items-center justify-center"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full border border-line bg-surface text-content-soft hover:bg-surface-hover transition-colors flex items-center justify-center"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 scrollbar-hide"
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
                <h3 className="text-content font-semibold text-sm sm:text-base mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                  {product.name}
                </h3>
                <p className="text-content-muted text-xs sm:text-sm mb-3 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
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
