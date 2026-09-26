import { ShoppingCart, Package } from 'lucide-react';
import { useState } from 'react';

interface FloatingButtonsProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onTrackClick: () => void;
}

export function FloatingButtons({ cartItemsCount, onCartClick, onTrackClick }: FloatingButtonsProps) {
  const [showCartTooltip, setShowCartTooltip] = useState(false);
  const [showTrackTooltip, setShowTrackTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <div className="relative">
        <button
          onClick={onTrackClick}
          onMouseEnter={() => setShowTrackTooltip(true)}
          onMouseLeave={() => setShowTrackTooltip(false)}
          className="bg-surface border border-line text-content-soft hover:text-content hover:bg-surface-hover w-14 h-14 md:w-16 md:h-16 rounded-full shadow-card-hover transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
          aria-label="Rastrear pedido"
        >
          <Package className="w-6 h-6 md:w-7 md:h-7" />
        </button>
        {showTrackTooltip && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-content text-bg px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg pointer-events-none">
            Rastrear
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={onCartClick}
          onMouseEnter={() => setShowCartTooltip(true)}
          onMouseLeave={() => setShowCartTooltip(false)}
          className="relative bg-brand hover:bg-brand-hover text-brand-contrast w-14 h-14 md:w-16 md:h-16 rounded-full shadow-card-hover transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
          aria-label="Ver carrito"
        >
          <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
          {cartItemsCount > 0 && (
            <span
              key={cartItemsCount}
              className="absolute -top-1 -right-1 bg-accent text-accent-contrast text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-[badgePop_.3s_ease]"
            >
              {cartItemsCount}
            </span>
          )}
        </button>
        {showCartTooltip && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-content text-bg px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg pointer-events-none">
            Carrito
          </div>
        )}
      </div>
    </div>
  );
}
