import { ShoppingCart, Package } from 'lucide-react';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onTrackClick: () => void;
}

export function Header({ cartItemsCount, onCartClick, onTrackClick }: HeaderProps) {
  return (
    <header className="bg-gradient-to-b from-slate-900 to-slate-800 border-b border-amber-500/20">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onTrackClick}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg transition-colors shadow-lg border border-amber-500/20 flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            <span className="hidden sm:inline">Rastrear</span>
          </button>
          <div className="flex-1 flex justify-center">
            <div className="flex flex-col items-center gap-3">
              <img
                src="/ryu.png"
                alt="Ryu Logo"
                className="h-24 md:h-32 lg:h-40 w-auto object-contain"
              />
              <img
                src="/ferreteria.png"
                alt="Ferretería Ryu"
                className="h-8 md:h-10 lg:h-12 w-auto object-contain"
              />
            </div>
          </div>
          <button
            onClick={onCartClick}
            className="relative bg-orange-600 hover:bg-orange-500 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-orange-500/50"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
