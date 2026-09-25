import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { adminListAdmins, adminSetAdminActive } from '../../services/admin';
import { formatDate } from '../../lib/format';
import type { AdminUser } from '../../lib/types';
import { PageHeader, Card, Button, EmptyState, ErrorBanner } from './ui';

export function AdminsAdmin() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

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

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <p className="text-blue-300 text-sm">
          Para dar acceso a un nuevo administrador, primero debe registrarse como usuario en la
          tienda; luego su <code className="text-blue-200">user_id</code> debe añadirse a la tabla{' '}
          <code className="text-blue-200">admin_users</code> desde Supabase. Aquí puedes activar o
          desactivar administradores existentes.
        </p>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="text-slate-400 p-6">Cargando...</p>
        ) : admins.length === 0 ? (
          <EmptyState message="No hay administradores registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-slate-400">
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
                  <tr key={admin.user_id} className="border-t border-slate-800">
                    <td className="p-3 text-slate-300 font-mono text-xs">{admin.user_id}</td>
                    <td className="p-3 text-slate-300 capitalize">{admin.role}</td>
                    <td className="p-3 text-slate-400 hidden sm:table-cell">
                      {formatDate(admin.created_at)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          admin.is_active ? 'bg-green-400/10 text-green-400' : 'bg-slate-700 text-slate-400'
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
