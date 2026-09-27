import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { storeConfig } from '../config/store.config';

const MIN_PASSWORD = 6;

/**
 * Página a la que llega el usuario desde el enlace de recuperación del correo.
 * Supabase crea una sesión temporal al abrir el enlace; aquí se define la nueva
 * contraseña con supabase.auth.updateUser.
 */
export function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Al abrir el enlace del correo, Supabase deja una sesión de recuperación.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setValidLink(true);
    });
    // También comprobamos si ya hay sesión (por si el evento ya ocurrió).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidLink(true);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-brand text-brand-contrast">
            <Store className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-content">{storeConfig.name}</h1>
        </div>

        <div className="bg-bg-elevated border border-line rounded-2xl p-8 shadow-card-hover">
          {!ready ? (
            <p className="text-content-muted text-center">Cargando...</p>
          ) : done ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-content mb-2">Contraseña actualizada</h2>
              <p className="text-content-muted mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-brand hover:bg-brand-hover text-brand-contrast font-bold py-3 rounded-full transition-colors"
              >
                Ir a la tienda
              </button>
            </div>
          ) : !validLink ? (
            <div className="text-center">
              <h2 className="text-xl font-bold text-content mb-2">Enlace no válido</h2>
              <p className="text-content-muted mb-6">
                El enlace de recuperación expiró o no es válido. Solicita uno nuevo desde la pantalla
                de inicio de sesión.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-surface hover:bg-surface-hover border border-line text-content font-semibold py-3 rounded-full transition-colors"
              >
                Volver a la tienda
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-content flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand" />
                Nueva contraseña
              </h2>

              <div>
                <label className="block text-content-soft text-sm mb-2">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bg-subtle border border-line rounded-lg px-4 py-3 pr-11 text-content focus:border-brand focus:outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
                    aria-label={show ? 'Ocultar' : 'Mostrar'}
                  >
                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-content-soft text-sm mb-2">Confirmar contraseña</label>
                <input
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-bg-subtle border border-line rounded-lg px-4 py-3 text-content focus:border-brand focus:outline-none"
                  placeholder="Repite la contraseña"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-hover text-brand-contrast font-bold py-3 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
