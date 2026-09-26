import { Package } from 'lucide-react';
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

/** Segundos que tarda una tarjeta en recorrer el ancho (menor = más rápido). */
const SECONDS_PER_CARD = 4;

export function FeaturedProducts({
  products,
  inventory,
  onProductClick,
  onAddToCart,
}: FeaturedProductsProps) {
  if (products.length === 0) return null;

  const inventoryFor = (id: string) => inventory.find((inv) => inv.product_id === id);

  // Duración proporcional a la cantidad de productos, para velocidad constante.
  const duration = products.length * SECONDS_PER_CARD;

  // Si hay pocos productos, no tiene sentido el marquee: se muestran centrados.
  const useMarquee = products.length >= 4;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-content tracking-tight">
          {storeConfig.content.featuredTitle}
        </h2>
      </div>

      {useMarquee ? (
        // Carrusel automático (marquee CSS): fluido y ligero, corre en GPU.
        <div className="marquee-viewport overflow-hidden">
          <div
            className="marquee-track gap-4 sm:gap-5"
            style={{ ['--marquee-duration' as string]: `${duration}s` }}
          >
            {/* Dos copias seguidas para un bucle perfecto. */}
            {[...products, ...products].map((product, index) => (
              <FeaturedCard
                key={`${product.id}-${index}`}
                product={product}
                inventory={inventoryFor(product.id)}
                onProductClick={onProductClick}
                onAddToCart={onAddToCart}
                priority={index < 3}
                ariaHidden={index >= products.length}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 scrollbar-hide">
          {products.map((product, index) => (
            <FeaturedCard
              key={product.id}
              product={product}
              inventory={inventoryFor(product.id)}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
              priority={index < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FeaturedCardProps {
  product: Product;
  inventory: Inventory | undefined;
  onProductClick: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  priority: boolean;
  ariaHidden?: boolean;
}

function FeaturedCard({
  product,
  inventory,
  onProductClick,
  onAddToCart,
  priority,
  ariaHidden,
}: FeaturedCardProps) {
  const inStock = inventory !== undefined && inventory.quantity > 0;
  const stockCount = inventory?.quantity ?? 0;

  return (
    <div
      aria-hidden={ariaHidden}
      onClick={() => onProductClick(product)}
      className="group flex-shrink-0 w-[150px] sm:w-[190px] lg:w-[210px] bg-surface border border-line rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer"
    >
      <div className="aspect-square bg-bg-subtle flex items-center justify-center overflow-hidden relative">
        {product.image_url ? (
          <ImageWithSkeleton
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            priority={priority}
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
}
