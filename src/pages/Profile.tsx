import { useState, useEffect, useCallback } from 'react';
import { LogOut, Copy, Check, Download, ShoppingBag, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { CustomerProfile, Order, OrderItem, Product } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { LoginModal } from '../components/LoginModal';
import { ReplaceCartModal } from '../components/ReplaceCartModal';
import {
  getProfile,
  updateProfile,
  getUserOrders,
  getOrderItems,
  getActiveProductsByIds,
} from '../services/profile';
import { calculateTotals, formatCurrency, formatDate } from '../lib/format';
import { storeConfig } from '../config/store.config';

interface ProfileProps {
  cartItemsCount: number;
  onReplaceCart: (products: Array<{ product: Product; quantity: number }>) => void;
}

interface OrderWithItems extends Order {
  items?: OrderItem[];
}

export function Profile({ cartItemsCount, onReplaceCart }: ProfileProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<CustomerProfile | null>(null);
  const [copiedTrackingCode, setCopiedTrackingCode] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isReplaceCartModalOpen, setIsReplaceCartModalOpen] = useState(false);
  const [pendingReorderItems, setPendingReorderItems] = useState<Array<{
    product: Product;
    quantity: number;
  }> | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const taxPercent = Math.round(storeConfig.finance.taxRate * 100);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const [profileData, ordersData] = await Promise.all([getProfile(userId), getUserOrders(userId)]);
      if (profileData) {
        setProfile(profileData);
        setEditData(profileData);
      }
      setOrders(ordersData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    load(user.id);
  }, [user, authLoading, load]);

  async function handleSaveProfile() {
    if (!editData) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateProfile(editData.id, {
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone,
        state: editData.state,
        city: editData.city,
      });
      setProfile(editData);
      setEditing(false);
    } catch {
      setFeedback('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyTracking(trackingCode: string) {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopiedTrackingCode(trackingCode);
      setTimeout(() => setCopiedTrackingCode(null), 2000);
    } catch {
      /* clipboard no disponible */
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  async function ensureOrderItems(order: OrderWithItems): Promise<OrderItem[]> {
    if (order.items) return order.items;
    const items = await getOrderItems(order.id);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, items } : o)));
    return items;
  }

  async function handleReorder(order: OrderWithItems) {
    setFeedback(null);
    try {
      const items = await ensureOrderItems(order);
      const productIds = items.map((item) => item.product_id);
      const products = await getActiveProductsByIds(productIds);

      const reorderItems = items
        .map((item) => {
          const product = products.find((p) => p.id === item.product_id);
          return product ? { product, quantity: item.quantity } : null;
        })
        .filter((x): x is { product: Product; quantity: number } => x !== null);

      if (reorderItems.length === 0) {
        setFeedback('Los productos de esta orden ya no están disponibles');
        return;
      }

      if (cartItemsCount > 0) {
        setPendingReorderItems(reorderItems);
        setIsReplaceCartModalOpen(true);
      } else {
        onReplaceCart(reorderItems);
        navigate('/');
      }
    } catch {
      setFeedback('Hubo un error al recomprar. Por favor intenta nuevamente.');
    }
  }

  function handleConfirmReplace() {
    if (pendingReorderItems) {
      onReplaceCart(pendingReorderItems);
      setPendingReorderItems(null);
      navigate('/');
    }
  }

  function orderSummary(order: OrderWithItems) {
    const items = order.items || [];
    const subtotal = items.reduce(
      (sum, item) => sum + (item.subtotal || (item.product_price || 0) * item.quantity),
      0
    );
    return calculateTotals(subtotal, 0);
  }

  async function toggleOrderDetails(orderId: string) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    const order = orders.find((o) => o.id === orderId);
    if (order) await ensureOrderItems(order);
    setExpandedOrderId(orderId);
  }

  function handleDownloadInvoice(order: OrderWithItems) {
    const html = generateInvoiceHTML(order, profile, orderSummary(order), taxPercent);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 100);
      }
    };
    setTimeout(() => {
      if (iframe.contentDocument?.readyState === 'complete') iframe.onload?.(new Event('load'));
    }, 10);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <p className="text-slate-400">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Header onLoginClick={() => setIsLoginOpen(true)} />
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
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsLoginOpen(false)} />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
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
      <Header />
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

          {feedback && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{feedback}</p>
            </div>
          )}

          {/* Datos personales */}
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
                  <LabeledInput
                    label="Nombre"
                    value={editData.first_name}
                    onChange={(v) => setEditData({ ...editData, first_name: v })}
                  />
                  <LabeledInput
                    label="Apellido"
                    value={editData.last_name}
                    onChange={(v) => setEditData({ ...editData, last_name: v })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LabeledInput
                    label="Teléfono"
                    value={editData.phone}
                    onChange={(v) => setEditData({ ...editData, phone: v })}
                  />
                  <LabeledInput
                    label="Estado"
                    value={editData.state}
                    onChange={(v) => setEditData({ ...editData, state: v })}
                  />
                </div>
                <LabeledInput
                  label="Ciudad"
                  value={editData.city}
                  onChange={(v) => setEditData({ ...editData, city: v })}
                />
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
                <InfoField label="Nombre completo" value={`${profile.first_name} ${profile.last_name}`} />
                <InfoField label="Teléfono" value={profile.phone || 'No proporcionado'} />
                <InfoField label="Estado" value={profile.state} />
                <InfoField label="Ciudad" value={profile.city} />
              </div>
            )}
          </div>

          {/* Compras */}
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
                    <div className="p-4">
                      <p className="text-white font-semibold">Código: {order.tracking_code}</p>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <InfoField label="Estado" value={order.status} capitalize />
                        <InfoField label="Total" value={formatCurrency(order.total_amount)} />
                        <InfoField label="Fecha" value={formatDate(order.created_at)} />
                      </div>
                      <button
                        onClick={() => toggleOrderDetails(order.id)}
                        className="mt-4 text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                      >
                        {expandedOrderId === order.id ? 'Ocultar detalles' : 'Ver detalles'}
                      </button>
                    </div>

                    {expandedOrderId === order.id && order.items && (
                      <div className="bg-slate-800/50 border-t border-slate-700 p-4">
                        <div className="space-y-3 mb-4">
                          {order.items.map((item) => {
                            const itemSubtotal =
                              item.subtotal || (item.product_price || 0) * item.quantity;
                            return (
                              <div
                                key={item.id}
                                className="flex justify-between text-sm text-slate-300 bg-slate-900 p-3 rounded"
                              >
                                <span>
                                  {item.product_name || 'Producto'} (x{item.quantity})
                                </span>
                                <span>{itemSubtotal > 0 ? formatCurrency(itemSubtotal) : '—'}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
                          {(() => {
                            const { subtotal, tax, shipping, total } = orderSummary(order);
                            return (
                              <div className="space-y-2 text-sm">
                                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                                <SummaryRow label={`${storeConfig.finance.taxLabel} (${taxPercent}%)`} value={formatCurrency(tax)} />
                                <SummaryRow label="Envío" value={formatCurrency(shipping)} />
                                <div className="flex justify-between text-white font-semibold border-t border-slate-600 pt-2 mt-2">
                                  <span>Total:</span>
                                  <span>{formatCurrency(total)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-700 pt-3">
                          <button
                            onClick={() => handleReorder(order)}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                          >
                            <RefreshCw className="w-5 h-5" />
                            Recomprar
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

      <ReplaceCartModal
        isOpen={isReplaceCartModalOpen}
        onClose={() => {
          setIsReplaceCartModalOpen(false);
          setPendingReorderItems(null);
        }}
        onConfirm={handleConfirmReplace}
        currentCartCount={cartItemsCount}
      />
    </>
  );
}

/* -------------------------------- Helpers -------------------------------- */

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-slate-300 text-sm mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
      />
    </div>
  );
}

function InfoField({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <p className="text-slate-500 text-sm mb-1">{label}</p>
      <p className={`text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-300">
      <span>{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function generateInvoiceHTML(
  order: OrderWithItems,
  profile: CustomerProfile | null,
  totals: { subtotal: number; tax: number; shipping: number; total: number },
  taxPercent: number
): string {
  const orderDate = formatDate(order.created_at);
  const itemsHTML = (order.items || [])
    .map((item) => {
      const unitPrice = item.product_price || 0;
      const itemSubtotal = item.subtotal || unitPrice * item.quantity;
      return `
      <tr>
        <td style="padding:12px;text-align:left;border-bottom:1px solid #e5e7eb;">${item.product_name || 'Producto'}</td>
        <td style="padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;">${item.quantity}</td>
        <td style="padding:12px;text-align:right;border-bottom:1px solid #e5e7eb;">${unitPrice > 0 ? formatCurrency(unitPrice) : '—'}</td>
        <td style="padding:12px;text-align:right;border-bottom:1px solid #e5e7eb;">${itemSubtotal > 0 ? formatCurrency(itemSubtotal) : '—'}</td>
      </tr>`;
    })
    .join('');

  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Factura ${order.tracking_code}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;padding:20px;background:white}
      .invoice{max-width:800px;margin:0 auto}
      .header{text-align:center;margin-bottom:30px;border-bottom:3px solid #1e293b;padding-bottom:20px}
      .header h1{margin:0;color:#1e293b;font-size:32px}
      .header p{margin:5px 0;color:#64748b}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}
      .info-box{background:#f8fafc;padding:15px;border-left:4px solid #f97316}
      .info-box label{font-weight:bold;color:#1e293b;display:block;margin-bottom:5px}
      .info-box p{margin:0;color:#475569}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th{background:#1e293b;color:white;padding:12px;text-align:left}
      .footer{text-align:center;margin-top:40px;border-top:1px solid #e2e8f0;padding-top:20px;color:#64748b;font-size:12px}
      .status{display:inline-block;padding:6px 12px;border-radius:4px;font-weight:bold;margin:10px 0}
      .status.pending{background:#fef3c7;color:#92400e}
      .status.confirmed{background:#dbeafe;color:#0c4a6e}
      .status.completed{background:#dcfce7;color:#166534}
      .status.cancelled{background:#fee2e2;color:#991b1b}
    </style></head><body>
      <div class="invoice">
        <div class="header"><h1>${storeConfig.name}</h1><p>Factura de Venta</p></div>
        <div class="info-grid">
          <div class="info-box"><label>Número de Tracking:</label><p>${order.tracking_code}</p></div>
          <div class="info-box"><label>Fecha:</label><p>${orderDate}</p></div>
        </div>
        <div class="info-grid">
          <div class="info-box"><label>Cliente:</label><p>${profile?.first_name ?? ''} ${profile?.last_name ?? ''}</p><p style="margin-top:8px;font-size:14px;">${profile?.phone || 'N/A'}</p></div>
          <div class="info-box"><label>Estado:</label><div class="status ${order.status}">${order.status.toUpperCase()}</div></div>
        </div>
        <table>
          <thead><tr><th>Producto</th><th style="text-align:center;">Cantidad</th><th style="text-align:right;">Precio Unitario</th><th style="text-align:right;">Subtotal</th></tr></thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div style="display:flex;justify-content:flex-end;margin:30px 0;">
          <div style="width:300px;">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;"><span style="color:#475569;">Subtotal:</span><span style="color:#1e293b;font-weight:600;">${formatCurrency(totals.subtotal)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;"><span style="color:#475569;">${storeConfig.finance.taxLabel} (${taxPercent}%):</span><span style="color:#1e293b;font-weight:600;">${formatCurrency(totals.tax)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;"><span style="color:#475569;">Envío:</span><span style="color:#1e293b;font-weight:600;">${formatCurrency(totals.shipping)}</span></div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;margin-top:8px;font-size:16px;font-weight:bold;"><span style="color:#1e293b;">TOTAL A PAGAR:</span><span style="color:#f97316;font-size:20px;">${formatCurrency(totals.total)}</span></div>
          </div>
        </div>
        <div class="footer"><p>Gracias por su compra</p><p>${storeConfig.name} - Todos los derechos reservados</p></div>
      </div>
    </body></html>`;
}
