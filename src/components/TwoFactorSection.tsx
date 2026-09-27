import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, Loader2, Smartphone } from 'lucide-react';
import {
  enrollTotp,
  verifyEnrollment,
  unenrollTotp,
  hasVerifiedTotp,
  getVerifiedFactorId,
  type EnrollResult,
} from '../services/mfa';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

/**
 * Sección de perfil para activar/desactivar la autenticación en dos pasos (2FA).
 */
export function TwoFactorSection() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [enrolling, setEnrolling] = useState<EnrollResult | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hasVerifiedTotp()
      .then(setActive)
      .catch(() => setActive(false))
      .finally(() => setLoading(false));
  }, []);

  async function startEnroll() {
    setError(null);
    setBusy(true);
    try {
      const result = await enrollTotp();
      setEnrolling(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la activación');
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    if (!enrolling) return;
    setError(null);
    setBusy(true);
    try {
      await verifyEnrollment(enrolling.factorId, code.trim());
      setActive(true);
      setEnrolling(null);
      setCode('');
      showToast('Autenticación en dos pasos activada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    const ok = await confirm({
      title: 'Desactivar 2FA',
      message: '¿Seguro que quieres desactivar la autenticación en dos pasos? Tu cuenta quedará protegida solo con la contraseña.',
      confirmText: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;

    setError(null);
    setBusy(true);
    try {
      const factorId = await getVerifiedFactorId();
      if (factorId) await unenrollTotp(factorId);
      setActive(false);
      showToast('Autenticación en dos pasos desactivada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar');
    } finally {
      setBusy(false);
    }
  }

  function cancelEnroll() {
    // Si el usuario canceló a mitad, intentamos limpiar el factor sin verificar.
    if (enrolling) unenrollTotp(enrolling.factorId).catch(() => undefined);
    setEnrolling(null);
    setCode('');
    setError(null);
  }

  return (
    <div className="bg-bg-elevated border border-line rounded-xl p-6 mb-8">
      <h2 className="text-xl font-bold text-content mb-1 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-brand" />
        Autenticación en dos pasos (2FA)
      </h2>
      <p className="text-content-muted text-sm mb-4">
        Añade una capa extra de seguridad con una app como Google Authenticator o Authy.
      </p>

      {loading ? (
        <p className="text-content-muted text-sm">Cargando...</p>
      ) : (
        <>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Estado actual */}
          {!enrolling && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {active ? (
                  <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <ShieldCheck className="w-4 h-4" /> Activada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-content-muted text-sm font-medium">
                    <ShieldOff className="w-4 h-4" /> Desactivada
                  </span>
                )}
              </div>
              {active ? (
                <button
                  onClick={disable}
                  disabled={busy}
                  className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                  Desactivar
                </button>
              ) : (
                <button
                  onClick={startEnroll}
                  disabled={busy}
                  className="bg-brand hover:bg-brand-hover text-brand-contrast px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Activar
                </button>
              )}
            </div>
          )}

          {/* Flujo de activación: QR + código */}
          {enrolling && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-content-soft text-sm">
                <Smartphone className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                <p>Escanea este código QR con tu app autenticadora y luego ingresa el código de 6 dígitos.</p>
              </div>

              <div className="flex justify-center">
                <div
                  className="bg-white p-3 rounded-lg"
                  // El QR viene como SVG data URI desde Supabase.
                  dangerouslySetInnerHTML={{ __html: qrToImg(enrolling.qrCode) }}
                />
              </div>

              <div className="text-center">
                <p className="text-content-muted text-xs mb-1">¿No puedes escanear? Ingresa esta clave:</p>
                <code className="text-content text-sm font-mono break-all">{enrolling.secret}</code>
              </div>

              <div>
                <label className="block text-content-soft text-sm mb-2">Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-bg-subtle border border-line rounded-lg px-4 py-3 text-content text-center text-2xl tracking-[0.4em] focus:border-brand focus:outline-none"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelEnroll}
                  disabled={busy}
                  className="flex-1 bg-surface hover:bg-surface-hover border border-line text-content py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmEnroll}
                  disabled={busy || code.length !== 6}
                  className="flex-1 bg-brand hover:bg-brand-hover text-brand-contrast py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirmar y activar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Supabase puede devolver el QR como data URI de imagen (<img src>) o como SVG.
 * Normalizamos a una etiqueta <img> o SVG embebido.
 */
function qrToImg(qr: string): string {
  if (qr.startsWith('<svg')) return qr;
  return `<img src="${qr}" alt="Código QR 2FA" width="180" height="180" />`;
}
