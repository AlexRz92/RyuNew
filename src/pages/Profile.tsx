import { useState, useEffect } from 'react';
import { supabase, OrderItem } from '../lib/supabase';
import { LogOut, Copy, Check, Download, ShoppingBag, RefreshCw, Loader2 as LoaderIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { LoginModal } from '../components/LoginModal';
import { states, getCitiesByState } from '../data/venezuelaData';

const formatUSD = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined || amount === 0) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatUSDForTotal = (amount: number | null | undefined) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

interface CustomerProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  state: string;
  city: string;
}

interface Order {
  id: string;
  tracking_code: string;
  status: string;
  total_amount: number;
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
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);

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

  async function handleReorder(order: Order) {
    try {
      setReorderingOrderId(order.id);

      if (!order.items || order.items.length === 0) {
        const items = await fetchOrderItems(order.id);
        order.items = items;
      }

      if (!order.items || order.items.length === 0) {
        alert('No se pudieron cargar los productos de esta orden');
        setReorderingOrderId(null);
        return;
      }

      const productIds = order.items.map((item) => item.product_id);

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, is_active')
        .in('id', productIds);

      if (error) {
        console.error('Error fetching products:', error);
        alert('Error al validar los productos');
        setReorderingOrderId(null);
        return;
      }

      const activeProductsMap = new Map(
        (products || [])
          .filter((p) => p.is_active)
          .map((p) => [p.id, p])
      );

      const validItems = [];
      const unavailableItems = [];

      for (const item of order.items) {
        const product = activeProductsMap.get(item.product_id);
        if (product) {
          validItems.push({
            product_id: item.product_id,
            quantity: item.quantity,
          });
        } else {
          unavailableItems.push(item.product_name);
        }
      }

      if (validItems.length === 0) {
        alert('Ninguno de los productos de esta orden está disponible actualmente');
        setReorderingOrderId(null);
        return;
      }

      if (unavailableItems.length > 0) {
        const message = `Los siguientes productos no están disponibles y serán omitidos:\n\n${unavailableItems.join('\n')}`;
        if (!confirm(message + '\n\n¿Deseas continuar agregando los productos disponibles al carrito?')) {
          setReorderingOrderId(null);
          return;
        }
      }

      navigate('/', {
        state: {
          reorderItems: validItems,
          openCart: true,
        },
      });
    } catch (error) {
      console.error('Error in handleReorder:', error);
      alert('Error al procesar la recompra');
      setReorderingOrderId(null);
    }
  }

  function calculateOrderSummary(order: Order) {
    const items = order.items || [];

    const subtotal = items.reduce((sum, item) => {
      const unitPrice = item.product_price || 0;
      const itemSubtotal = item.subtotal || (unitPrice * item.quantity);
      return sum + itemSubtotal;
    }, 0);

    const iva = subtotal * 0.19;
    const shipping = 0;
    const total = subtotal + iva + shipping;

    return { subtotal, iva, shipping, total };
  }

  function generateInvoiceHTML(order: Order) {
    const orderDate = new Date(order.created_at).toLocaleDateString('es-VE');
    const itemsHTML = (order.items || []).map(item => {
      const unitPrice = item.product_price || 0;
      const itemSubtotal = item.subtotal || (unitPrice * item.quantity);
      const displayPrice = unitPrice > 0 ? formatUSD(unitPrice) : '—';
      const displaySubtotal = itemSubtotal > 0 ? formatUSD(itemSubtotal) : '—';

      return `
      <tr>
        <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">${item.product_name || 'Producto'}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${displayPrice}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${displaySubtotal}</td>
      </tr>
      `;
    }).join('');

    const { subtotal, iva, shipping, total } = calculateOrderSummary(order);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura ${order.tracking_code}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
          .invoice { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e293b; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #1e293b; font-size: 32px; }
          .header p { margin: 5px 0; color: #64748b; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .info-box { background: #f8fafc; padding: 15px; border-left: 4px solid #f97316; }
          .info-box label { font-weight: bold; color: #1e293b; display: block; margin-bottom: 5px; }
          .info-box p { margin: 0; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #1e293b; color: white; padding: 12px; text-align: left; }
          .total-section { text-align: right; margin: 30px 0; }
          .total-amount { font-size: 24px; font-weight: bold; color: #1e293b; margin: 10px 0; }
          .footer { text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 12px; }
          .status { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
          .status.pending { background: #fef3c7; color: #92400e; }
          .status.confirmed { background: #dbeafe; color: #0c4a6e; }
          .status.completed { background: #dcfce7; color: #166534; }
          .status.cancelled { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <h1>Ferretería RYU</h1>
            <p>Factura de Venta</p>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <label>Número de Tracking:</label>
              <p>${order.tracking_code}</p>
            </div>
            <div class="info-box">
              <label>Fecha:</label>
              <p>${orderDate}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <label>Cliente:</label>
              <p>${profile?.first_name} ${profile?.last_name}</p>
              <p style="margin-top: 8px; font-size: 14px;">${profile?.phone || 'N/A'}</p>
            </div>
            <div class="info-box">
              <label>Estado:</label>
              <div class="status ${order.status}">${order.status.toUpperCase()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unitario</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="total-section">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
              <div style="width: 300px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
                  <span style="color: #475569;">Subtotal:</span>
                  <span style="color: #1e293b; font-weight: 600;">${formatUSDForTotal(subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
                  <span style="color: #475569;">IVA (19%):</span>
                  <span style="color: #1e293b; font-weight: 600;">${formatUSDForTotal(iva)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
                  <span style="color: #475569;">Envío:</span>
                  <span style="color: #1e293b; font-weight: 600;">${formatUSDForTotal(shipping)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px; font-size: 16px; font-weight: bold;">
                  <span style="color: #1e293b;">TOTAL A PAGAR:</span>
                  <span style="color: #f97316; font-size: 20px;">${formatUSDForTotal(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Gracias por su compra</p>
            <p>Ferretería RYU - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  function handleDownloadInvoice(order: Order) {
    const html = generateInvoiceHTML(order);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      console.error('No se pudo acceder al documento del iframe');
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 100);
      } catch (error) {
        console.error('Error al imprimir:', error);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }
    };

    setTimeout(() => {
      if (iframe.contentDocument?.readyState === 'complete') {
        iframe.onload?.(new Event('load'));
      }
    }, 10);
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
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Ir a la tienda
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
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
                  <select
                    value={editData.state}
                    onChange={(e) => setEditData({ ...editData, state: e.target.value, city: '' })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Selecciona un estado</option>
                    {states.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Ciudad</label>
                  <select
                    value={editData.city}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    disabled={!editData.state}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona una ciudad</option>
                    {editData.state && getCitiesByState(editData.state).map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                <p className="text-white">{states.find((s) => s.code === profile.state)?.name || profile.state}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Ciudad</p>
                <p className="text-white">{profile.city || 'No especificada'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Mis Compras
          </h2>

          {!orders || orders.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No tienes compras registradas</p>
          ) : (
            <div className="space-y-4">
              {(orders || []).map((order) => (
                <div key={order.id} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="text-white font-semibold">Código: {order.tracking_code}</p>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-400">
                          <div>
                            <p className="text-slate-500">Estado</p>
                            <p className="text-white capitalize">{order.status}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Total</p>
                            <p className="text-white">{formatUSDForTotal(order.total_amount)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Fecha</p>
                            <p className="text-white">{new Date(order.created_at).toLocaleDateString('es-VE')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                    >
                      {expandedOrderId === order.id ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>
                  </div>

                  {expandedOrderId === order.id && order.items && (
                    <div className="bg-slate-800/50 border-t border-slate-700 p-4">
                      <div className="space-y-3 mb-4">
                        {order.items.map((item) => {
                          const unitPrice = item.product_price || 0;
                          const itemSubtotal = item.subtotal || (unitPrice * item.quantity);
                          const displaySubtotal = itemSubtotal > 0 ? formatUSD(itemSubtotal) : '—';

                          return (
                            <div key={item.id} className="flex justify-between text-sm text-slate-300 bg-slate-900 p-3 rounded">
                              <span>{item.product_name || 'Producto'} (x{item.quantity})</span>
                              <span>{displaySubtotal}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
                        {(() => {
                          const { subtotal, iva, shipping, total } = calculateOrderSummary(order);
                          return (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between text-slate-300">
                                <span>Subtotal:</span>
                                <span>{formatUSDForTotal(subtotal)}</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>IVA (19%):</span>
                                <span>{formatUSDForTotal(iva)}</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Envío:</span>
                                <span>{formatUSDForTotal(shipping)}</span>
                              </div>
                              <div className="flex justify-between text-white font-semibold border-t border-slate-600 pt-2 mt-2">
                                <span>Total:</span>
                                <span>{formatUSDForTotal(total)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-700 pt-3">
                        <button
                          onClick={() => handleReorder(order)}
                          disabled={reorderingOrderId === order.id}
                          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reorderingOrderId === order.id ? (
                            <>
                              <LoaderIcon className="w-5 h-5 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-5 h-5" />
                              Recomprar
                            </>
                          )}
                        </button>
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
                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors"
                        >
                          <Download className="w-5 h-5" />
                          Descargar factura (PDF)
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
