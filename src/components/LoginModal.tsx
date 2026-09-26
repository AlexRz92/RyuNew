import { X, Mail, Lock, Loader2, Eye, EyeOff, Store, Check } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { upsertProfile } from '../services/profile';
import { storeConfig } from '../config/store.config';
import { states, getCitiesByState } from '../data/venezuelaData';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const MIN_PASSWORD = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    state: '',
    city: '',
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const resetForm = () => {
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setProfileData({ first_name: '', last_name: '', phone: '', state: '', city: '' });
  };

  // Cierra el modal, limpia el formulario y vuelve a la pestaña de inicio de
  // sesión, para no conservar datos antiguos la próxima vez que se abra.
  const handleClose = () => {
    resetForm();
    setIsLogin(true);
    onClose();
  };

  if (!isOpen) return null;

  const handleStateChange = (stateCode: string) => {
    setProfileData({ ...profileData, state: stateCode, city: '' });
  };

  // Reglas de fuerza de contraseña (solo para el registro).
  const passwordChecks = {
    length: password.length >= MIN_PASSWORD,
    number: /\d/.test(password),
    letter: /[a-zA-Z]/.test(password),
  };
  const passwordStrong = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!isLogin) {
      if (!profileData.first_name || !profileData.last_name || !profileData.state || !profileData.city) {
        setError('Por favor completa todos los campos obligatorios (*).');
        return;
      }
      if (!passwordStrong) {
        setError('La contraseña debe tener al menos 6 caracteres, una letra y un número.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onLoginSuccess();
      } else {
        // Guardamos el NOMBRE del estado (no el código) para que sea
        // consistente con el checkout y las reglas de envío.
        const stateName = states.find((s) => s.code === profileData.state)?.name || profileData.state;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              phone: profileData.phone,
              state: stateName,
              city: profileData.city,
            },
          },
        });
        if (signUpError) throw signUpError;

        if (data.user) {
          await upsertProfile({
            id: data.user.id,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            state: stateName,
            city: profileData.city,
          }).catch(() => undefined);
        }
        onLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-bg-subtle border border-line rounded-lg px-4 py-3 text-content focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-bg-elevated border border-line rounded-2xl w-full max-w-md shadow-card-hover">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-3">
            {storeConfig.branding.logo ? (
              <img src={storeConfig.branding.logo} alt={storeConfig.name} className="h-9 w-auto object-contain" />
            ) : (
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-brand text-brand-contrast">
                <Store className="w-5 h-5" />
              </span>
            )}
            <div>
              <h2 className="text-lg font-bold text-content leading-tight">
                {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <p className="text-content-muted text-xs">{storeConfig.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-content-muted hover:text-content transition-colors p-2 hover:bg-surface rounded-full"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-content-soft text-sm mb-2">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-content-soft text-sm mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pl-10 pr-11`}
                placeholder="••••••••"
                minLength={MIN_PASSWORD}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Requisitos de contraseña (solo en registro) */}
            {!isLogin && password.length > 0 && (
              <div className="mt-2 space-y-1">
                <PasswordRule ok={passwordChecks.length} text="Al menos 6 caracteres" />
                <PasswordRule ok={passwordChecks.letter} text="Contiene una letra" />
                <PasswordRule ok={passwordChecks.number} text="Contiene un número" />
              </div>
            )}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-content-soft text-sm mb-2">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} pl-10 ${
                      confirmPassword.length > 0 && confirmPassword !== password
                        ? 'border-red-500 focus:ring-red-500/30'
                        : ''
                    }`}
                    placeholder="Repite tu contraseña"
                  />
                </div>
                {confirmPassword.length > 0 && confirmPassword !== password && (
                  <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-content-soft text-sm mb-2">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    className={inputClass}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-content-soft text-sm mb-2">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    className={inputClass}
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-content-soft text-sm mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className={inputClass}
                  placeholder="0424-1234567"
                />
                <p className="text-content-muted text-xs mt-1">
                  Lo usaremos para coordinar la entrega de tus pedidos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-content-soft text-sm mb-2">Estado *</label>
                  <select
                    required
                    value={profileData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccionar</option>
                    {states.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-content-soft text-sm mb-2">Ciudad *</label>
                  <select
                    required
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    disabled={!profileData.state}
                    className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">Seleccionar</option>
                    {profileData.state &&
                      getCitiesByState(profileData.state).map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover text-brand-contrast font-bold py-3 rounded-full transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                resetForm();
              }}
              className="text-brand hover:text-brand-hover text-sm font-medium transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordRule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-content-muted'}`}>
      <Check className={`w-3.5 h-3.5 ${ok ? 'opacity-100' : 'opacity-40'}`} />
      {text}
    </div>
  );
}
