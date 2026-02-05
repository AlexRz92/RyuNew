import { Search, User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onLoginClick?: () => void;
}

export function Header({ onSearch, searchQuery = '', onLoginClick }: HeaderProps) {
  const { user } = useAuth();
  return (
    <header className="bg-gradient-to-b from-slate-900 to-slate-800 border-b border-amber-500/20 w-full">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1" />
          {user ? (
            <Link
              to="/perfil"
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              <User className="w-5 h-5" />
              <span className="text-sm">Mi Perfil</span>
            </Link>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              <LogIn className="w-5 h-5" />
              <span className="text-sm">Iniciar sesión</span>
            </button>
          )}
        </div>
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
              className="h-8 md:h-12 lg:h-16 w-auto object-contain"
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
