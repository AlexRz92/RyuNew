import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, Loader2, KeyRound } from 'lucide-react';
import { adminListAdmins, adminSetAdminActive, adminResetUserMfa } from '../../services/admin';
import { formatDate } from '../../lib/format';
import type { AdminUser } from '../../lib/types';
import { PageHeader, Card, Button, Input, Field, EmptyState, ErrorBanner } from './ui';
import { useToast } from '../../contexts/ToastContext';

export function AdminsAdmin() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState('');
  const [resettingMfa, setResettingMfa] = useState(false);

  async function handleResetMfa() {
    if (!resetUserId.trim()) return;
    setResettingMfa(true);
    setError(null);
    try {
      const removed = await adminResetUserMfa(resetUserId.trim());
      showToast(removed > 0 ? `2FA reseteado (${removed} factor(es) eliminados)` : 'El usuario no tenía 2FA activo');
      setResetUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo resetear el 2FA');
    } finally {
      setResettingMfa(false);
    }
  }

  async function reload() {
    setLoading(true);
    try {
      setAdmins(await adminListAdmins());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function toggle(admin: AdminUser) {
    setUpdating(admin.user_id);
    setError(null);
    try {
      await adminSetAdminActive(admin.user_id, !admin.is_active);
      setAdmins((prev) =>
        prev.map((a) => (a.user_id === admin.user_id ? { ...a, is_active: !a.is_active } : a))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <PageHeader title="Administradores" description="Gestiona quién tiene acceso al panel" />

      {error && <ErrorBanner message={error} />}

      <div className="bg-brand-soft border border-brand/30 rounded-lg p-4 mb-6">
        <p className="text-content-soft text-sm">
          Para dar acceso a un nuevo administrador, primero debe registrarse como usuario en la
          tienda; luego su <code className="text-content">user_id</code> debe añadirse a la tabla{' '}
          <code className="text-content">admin_users</code> desde Supabase. Aquí puedes activar o
          desactivar administradores existentes.
        </p>
      </div>

      {/* Resetear 2FA de un usuario que perdió su dispositivo */}
      <Card className="p-5 mb-6">
        <h2 className="text-content font-semibold mb-1 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-brand" />
          Resetear 2FA de un usuario
        </h2>
        <p className="text-content-muted text-sm mb-4">
          Si un cliente perdió su teléfono/autenticador y no puede entrar, pega aquí su
          <code className="text-content"> user_id</code> (lo ves en Supabase → Authentication → Users)
          para quitarle el 2FA. Luego podrá entrar solo con su contraseña y volver a activarlo.
        </p>
        <div className="flex items-end gap-3 flex-wrap">
          <Field label="User ID del cliente">
            <Input
              value={resetUserId}
              onChange={(e) => setResetUserId(e.target.value)}
              placeholder="uuid del usuario"
              className="w-80 max-w-full font-mono text-xs"
            />
          </Field>
          <Button variant="danger" onClick={handleResetMfa} disabled={resettingMfa || !resetUserId.trim()}>
            {resettingMfa ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Resetear 2FA
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="text-content-muted p-6">Cargando...</p>
        ) : admins.length === 0 ? (
          <EmptyState message="No hay administradores registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-content-muted">
                <tr>
                  <th className="text-left p-3 font-medium">User ID</th>
                  <th className="text-left p-3 font-medium">Rol</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Creado</th>
                  <th className="text-center p-3 font-medium">Estado</th>
                  <th className="text-right p-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.user_id} className="border-t border-line">
                    <td className="p-3 text-content-soft font-mono text-xs">{admin.user_id}</td>
                    <td className="p-3 text-content-soft capitalize">{admin.role}</td>
                    <td className="p-3 text-content-muted hidden sm:table-cell">
                      {formatDate(admin.created_at)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          admin.is_active ? 'bg-green-400/10 text-green-400' : 'bg-surface-hover text-content-muted'
                        }`}
                      >
                        {admin.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant={admin.is_active ? 'danger' : 'primary'}
                        onClick={() => toggle(admin)}
                        disabled={updating === admin.user_id}
                      >
                        {updating === admin.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : admin.is_active ? (
                          <>
                            <ShieldOff className="w-4 h-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Activar
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
