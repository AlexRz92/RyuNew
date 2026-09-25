import { Search, User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storeConfig } from '../config/store.config';
import { ThemeToggle } from './ThemeToggle';
import type { Product } from '../lib/types';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onLoginClick?: () => void;
  suggestions?: Product[];
  onSuggestionClick?: (product: Product) => void;
}

export function Header({
  onSearch,
  searchQuery = '',
  onLoginClick,
  suggestions = [],
  onSuggestionClick,
}: HeaderProps) {
  const { user } = useAuth();
  const { name, branding } = storeConfig;

  return (
    <header className="sticky top-0 z-30 bg-bg-elevated/90 backdrop-blur-md border-b border-line">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Marca */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            {branding.logo ? (
              <img src={branding.logo} alt={name} className="h-9 md:h-11 w-auto object-contain" />
            ) : (
              <span className="inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-brand text-brand-contrast font-bold text-lg">
                {name.charAt(0)}
              </span>
            )}
            {branding.logoText ? (
              <img src={branding.logoText} alt={name} className="h-7 md:h-9 w-auto object-contain" />
            ) : (
              <span className="text-lg md:text-xl font-bold text-content tracking-tight hidden sm:block">
                {name}
              </span>
            )}
          </Link>

          {/* Buscador */}
          {onSearch && (
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-bg-subtle border border-line rounded-full pl-11 pr-4 py-2.5 text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
              />
              {suggestions.length > 0 && searchQuery && (
                <div className="absolute z-20 mt-2 left-0 right-0 bg-bg-elevated border border-line rounded-xl shadow-card-hover max-h-72 overflow-y-auto overflow-hidden">
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => onSuggestionClick?.(product)}
                      className="w-full text-left px-4 py-2.5 text-sm text-content hover:bg-surface-hover flex flex-col gap-0.5 border-b border-line last:border-0"
                    >
                      <span className="font-medium line-clamp-1">{product.name}</span>
                      <span className="text-xs text-content-muted line-clamp-1">{product.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-auto">
            <ThemeToggle />
            {user ? (
              <Link
                to="/perfil"
                className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-line text-content px-3 md:px-4 py-2 rounded-full transition-colors font-medium"
              >
                <User className="w-5 h-5" />
                <span className="text-sm hidden sm:block">Mi Perfil</span>
              </Link>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-brand-contrast px-3 md:px-5 py-2 rounded-full transition-colors font-semibold"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-sm hidden sm:block">Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
