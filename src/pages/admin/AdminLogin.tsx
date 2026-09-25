import { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Store className="w-8 h-8 text-amber-400" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{storeConfig.name}</h1>
            <p className="text-slate-400 text-sm">Panel de administración</p>
          </div>
        </div>

        {isAuthenticatedNonAdmin ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-xl p-8 text-center">
            <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Acceso restringido</h2>
            <p className="text-slate-400 mb-6">
              Tu cuenta no tiene permisos de administrador. Inicia sesión con una cuenta autorizada.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogoutAndRetry}
                className="bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cambiar de cuenta
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Volver a la tienda
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-8 space-y-5 shadow-2xl"
          >
            <div>
              <label className="block text-slate-300 text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="admin@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar sesión'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-slate-400 hover:text-white text-sm transition-colors"
            >
              Volver a la tienda
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
