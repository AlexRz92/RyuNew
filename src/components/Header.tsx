import { Search } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Header({ onSearch, searchQuery = '' }: HeaderProps) {
  return (
    <header className="bg-gradient-to-b from-slate-900 to-slate-800 border-b border-amber-500/20 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex justify-center mb-6">
          <div className="flex flex-col items-center gap-3">
            <img
              src="/ryu.png"
              alt="Ryu Logo"
              className="h-20 md:h-28 lg:h-32 w-auto object-contain"
            />
            <img
              src="/ferreteria.png"
              alt="Ferretería Ryu"
              className="h-6 md:h-8 lg:h-10 w-auto object-contain"
            />
          </div>
        </div>

        {onSearch && (
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-slate-700/50 border border-amber-500/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:bg-slate-700 transition-all"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
