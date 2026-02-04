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
      <div className="relative group">
        <button
          onClick={onTrackClick}
          onMouseEnter={() => setShowTrackTooltip(true)}
          onMouseLeave={() => setShowTrackTooltip(false)}
          className="bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
        >
          <Package className="w-6 h-6 md:w-7 md:h-7" />
        </button>

        {showTrackTooltip && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg border border-amber-500/20 pointer-events-none">
            Rastrear
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-8 border-transparent border-l-slate-900" />
          </div>
        )}
      </div>

      <div className="relative group">
        <button
          onClick={onCartClick}
          onMouseEnter={() => setShowCartTooltip(true)}
          onMouseLeave={() => setShowCartTooltip(false)}
          className="relative bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl hover:shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
        >
          <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
              {cartItemsCount}
            </span>
          )}
        </button>

        {showCartTooltip && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg border border-amber-500/20 pointer-events-none">
            Carrito
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-8 border-transparent border-l-slate-900" />
          </div>
        )}
      </div>
    </div>
  );
}
