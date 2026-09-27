import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, Loader2, KeyRound, Search } from 'lucide-react';
import {
  adminListAdmins,
  adminSetAdminActive,
  adminResetUserMfa,
  adminListMfaUsers,
  type MfaUser,
} from '../../services/admin';
import { formatDate } from '../../lib/format';
import type { AdminUser } from '../../lib/types';
import { PageHeader, Card, Button, Input, EmptyState, ErrorBanner } from './ui';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

export function AdminsAdmin() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Usuarios con 2FA activo
  const [mfaUsers, setMfaUsers] = useState<MfaUser[]>([]);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaSearch, setMfaSearch] = useState('');
  const [resettingId, setResettingId] = useState<string | null>(null);

  async function loadMfaUsers() {
    setMfaLoading(true);
    try {
      setMfaUsers(await adminListMfaUsers());
    } catch {
      /* si falla (edge function no desplegada), dejamos la lista vacía */
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleResetMfa(user: MfaUser) {
    const ok = await confirm({
      title: 'Resetear 2FA',
      message: `¿Quitar el 2FA de ${user.name || user.email}? Podrá entrar solo con su contraseña y volver a activarlo.`,
      confirmText: 'Resetear 2FA',
      variant: 'danger',
    });
    if (!ok) return;

    setResettingId(user.user_id);
    setError(null);
    try {
      await adminResetUserMfa(user.user_id);
      showToast('2FA reseteado correctamente');
      setMfaUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo resetear el 2FA');
    } finally {
      setResettingId(null);
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
    loadMfaUsers();
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

      {/* Usuarios con 2FA activo: buscar y resetear si perdieron el dispositivo */}
      <Card className="p-5 mb-6">
        <h2 className="text-content font-semibold mb-1 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-brand" />
          Usuarios con 2FA activo
        </h2>
        <p className="text-content-muted text-sm mb-4">
          Si un cliente perdió su teléfono/autenticador, resetéale el 2FA. Podrá entrar solo con su
          contraseña y volver a activarlo.
        </p>

        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-muted pointer-events-none" />
          <Input
            value={mfaSearch}
            onChange={(e) => setMfaSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="pl-10"
          />
        </div>

        {mfaLoading ? (
          <p className="text-content-muted text-sm">Cargando usuarios...</p>
        ) : (() => {
            const term = mfaSearch.trim().toLowerCase();
            const list = mfaUsers.filter(
              (u) =>
                term === '' ||
                u.name.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term)
            );
            if (mfaUsers.length === 0) {
              return <p className="text-content-muted text-sm">Ningún usuario tiene 2FA activo.</p>;
            }
            if (list.length === 0) {
              return <p className="text-content-muted text-sm">Sin resultados para “{mfaSearch}”.</p>;
            }
            return (
              <div className="space-y-2">
                {list.map((u) => (
                  <div
                    key={u.user_id}
                    className="flex items-center justify-between gap-3 bg-bg-subtle rounded-lg p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-content font-medium truncate">{u.name}</p>
                      <p className="text-content-muted text-xs truncate">{u.email}</p>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => handleResetMfa(u)}
                      disabled={resettingId === u.user_id}
                    >
                      {resettingId === u.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4" />
                      )}
                      Resetear 2FA
                    </Button>
                  </div>
                ))}
              </div>
            );
          })()}
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
