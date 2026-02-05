import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Copy, Check, Download, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { LoginModal } from '../components/LoginModal';

interface CustomerProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  state: string;
  city: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name?: string;
}

interface Order {
  id: string;
  tracking_code: string;
  status: string;
  total: number;
  created_at: string;
  items?: OrderItem[];
}

export function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<CustomerProfile | null>(null);
  const [copiedTrackingCode, setCopiedTrackingCode] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState<boolean | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  async function checkAuthentication() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticatedUser(false);
        setLoading(false);
        return;
      }

      setIsAuthenticatedUser(true);
      await fetchProfile(user.id);
      await fetchOrders(user.id);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticatedUser(false);
      setLoading(false);
    }
  }

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setEditData(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders(userId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  async function fetchOrderItems(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching order items:', error);
      return [];
    }
  }

  async function handleSaveProfile() {
    if (!editData) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('customer_profiles')
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          phone: editData.phone,
          state: editData.state,
          city: editData.city,
        })
        .eq('id', editData.id);

      if (error) throw error;
      setProfile(editData);
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyTracking(trackingCode: string) {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopiedTrackingCode(trackingCode);
      setTimeout(() => setCopiedTrackingCode(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  async function handleLoginSuccess() {
    setIsLoginOpen(false);
    await checkAuthentication();
  }

  async function toggleOrderDetails(orderId: string) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (order && !order.items) {
      const items = await fetchOrderItems(orderId);
      setOrders(orders.map(o => o.id === orderId ? { ...o, items } : o));
    }

    setExpandedOrderId(orderId);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticatedUser === false) {
    return (
      <>
        <Header user={null} />
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
          <div className="text-center bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-8 max-w-md mx-4">
            <p className="text-slate-400 mb-6">Inicia sesión para ver tu perfil y tus compras</p>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg transition-colors w-full font-semibold"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header user={null} />
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
          <div className="text-center bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-8 max-w-md mx-4">
            <p className="text-slate-400 mb-6">No se encontró el perfil</p>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={null} />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">Datos Personales</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Editar
              </button>
            )}
          </div>

          {editing && editData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Nombre</label>
                  <input
                    type="text"
                    value={editData.first_name}
                    onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Apellido</label>
                  <input
                    type="text"
                    value={editData.last_name}
                    onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Estado</label>
                  <input
                    type="text"
                    value={editData.state}
                    onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Ciudad</label>
                <input
                  type="text"
                  value={editData.city}
                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditData(profile);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Nombre completo</p>
                <p className="text-white">{profile.first_name} {profile.last_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Teléfono</p>
                <p className="text-white">{profile.phone || 'No proporcionado'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Estado</p>
                <p className="text-white">{profile.state}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Ciudad</p>
                <p className="text-white">{profile.city}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Mis Compras
          </h2>

          {orders.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No tienes compras registradas</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleOrderDetails(order.id)}
                    className="w-full p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold">Código: {order.tracking_code}</p>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-400">
                        <div>
                          <p className="text-slate-500">Estado</p>
                          <p className="text-white capitalize">{order.status}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Total</p>
                          <p className="text-white">Bs {order.total.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Fecha</p>
                          <p className="text-white">{new Date(order.created_at).toLocaleDateString('es-VE')}</p>
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-400">{expandedOrderId === order.id ? '▼' : '▶'}</span>
                  </button>

                  {expandedOrderId === order.id && order.items && (
                    <div className="bg-slate-800/50 border-t border-slate-700 p-4">
                      <div className="space-y-3 mb-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-slate-300 bg-slate-900 p-3 rounded">
                            <span>{item.product_name || 'Producto'} (x{item.quantity})</span>
                            <span>Bs {(item.unit_price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-700">
                        <button
                          onClick={() => handleCopyTracking(order.tracking_code)}
                          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                        >
                          {copiedTrackingCode === order.tracking_code ? (
                            <>
                              <Check className="w-5 h-5" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-5 h-5" />
                              Copiar tracking
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
