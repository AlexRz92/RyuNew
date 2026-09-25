import { useState, type FormEvent } from 'react';
import { Loader2, Lock, Mail, ShieldAlert, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { storeConfig } from '../../config/store.config';

interface AdminLoginProps {
  /** true si hay un usuario logueado pero SIN permisos de administrador. */
  isAuthenticatedNonAdmin?: boolean;
}

export function AdminLogin({ isAuthenticatedNonAdmin = false }: AdminLoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      // El hook useAdmin revalidará el estado tras el cambio de sesión.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAndRetry = async () => {
    await supabase.auth.signOut();
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Store className="w-8 h-8 text-accent" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-content">{storeConfig.name}</h1>
            <p className="text-content-muted text-sm">Panel de administración</p>
          </div>
        </div>

        {isAuthenticatedNonAdmin ? (
          <div className="bg-bg-elevated border border-red-500/40 rounded-xl p-8 text-center">
            <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-content mb-2">Acceso restringido</h2>
            <p className="text-content-muted mb-6">
              Tu cuenta no tiene permisos de administrador. Inicia sesión con una cuenta autorizada.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogoutAndRetry}
                className="bg-brand hover:bg-brand-hover text-brand-contrast font-semibold py-3 rounded-lg transition-colors"
              >
                Cambiar de cuenta
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-surface-hover hover:bg-surface-hover text-content font-semibold py-3 rounded-lg transition-colors"
              >
                Volver a la tienda
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-bg-elevated border border-line rounded-xl p-8 space-y-5 shadow-2xl"
          >
            <div>
              <label className="block text-content-soft text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-elevated border border-line rounded-lg pl-10 pr-4 py-3 text-content focus:border-brand focus:outline-none"
                  placeholder="admin@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-content-soft text-sm mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-elevated border border-line rounded-lg pl-10 pr-4 py-3 text-content focus:border-brand focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-brand-contrast font-bold py-3 rounded-lg transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar sesión'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-content-muted hover:text-content text-sm transition-colors"
            >
              Volver a la tienda
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
