import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Tags,
  ShoppingCart,
  Truck,
  Landmark,
  Users,
  LogOut,
  Store,
  Menu,
  X,
} from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { storeConfig } from '../../config/store.config';
import { AdminLogin } from './AdminLogin';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/inventario', label: 'Inventario', icon: Boxes },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/admin/envios', label: 'Envíos', icon: Truck },
  { to: '/admin/cuentas', label: 'Cuentas bancarias', icon: Landmark },
  { to: '/admin/administradores', label: 'Administradores', icon: Users },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { isAdmin, loading, user } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Verificando acceso...</p>
      </div>
    );
  }

  // Sin sesión o sin permisos de admin: mostramos el login de administrador.
  if (!user || !isAdmin) {
    return <AdminLogin isAuthenticatedNonAdmin={Boolean(user) && !isAdmin} />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <Store className="w-6 h-6 text-amber-400" />
          <div>
            <p className="text-white font-bold leading-tight">{storeConfig.name}</p>
            <p className="text-slate-500 text-xs">Panel de administración</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Store className="w-5 h-5" />
            Ver tienda
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-white" aria-label="Abrir menú">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold">{storeConfig.name} · Admin</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
