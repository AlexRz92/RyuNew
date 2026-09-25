import { useEffect, useState } from 'react';
import { Eye, ExternalLink, Loader2 } from 'lucide-react';
import {
  adminListOrders,
  adminUpdateOrderStatus,
} from '../../services/admin';
import { getOrderItems } from '../../services/profile';
import { formatCurrency, formatDate } from '../../lib/format';
import type { Order, OrderItem, OrderStatus } from '../../lib/types';
import {
  PageHeader,
  Card,
  Button,
  Select,
  Modal,
  EmptyState,
  ErrorBanner,
  StatusBadge,
} from './ui';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

export function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [detail, setDetail] = useState<Order | null>(null);
  const [detailItems, setDetailItems] = useState<OrderItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      setOrders(await adminListOrders());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function openDetail(order: Order) {
    setDetail(order);
    setDetailLoading(true);
    try {
      setDetailItems(await getOrderItems(order.id));
    } catch {
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    setUpdatingId(order.id);
    setError(null);
    try {
      await adminUpdateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
      if (detail?.id === order.id) setDetail({ ...detail, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <PageHeader title="Pedidos" description="Revisa y actualiza el estado de los pedidos" />

      {error && <ErrorBanner message={error} />}

      <div className="mb-4 flex gap-2 flex-wrap">
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-brand text-brand-contrast' : 'bg-surface text-content-muted hover:text-content'
            }`}
          >
            {s === 'all' ? 'Todos' : s}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="text-content-muted p-6">Cargando...</p>
        ) : filtered.length === 0 ? (
          <EmptyState message="No hay pedidos" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-content-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Código</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Cliente</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Fecha</th>
                  <th className="text-left p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                  <th className="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-t border-line">
                    <td className="p-3 text-content font-medium">{order.tracking_code}</td>
                    <td className="p-3 text-content-muted hidden md:table-cell">{order.customer_name}</td>
                    <td className="p-3 text-content-muted hidden lg:table-cell">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="p-3 text-accent font-semibold">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end items-center gap-2">
                        <Select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => changeStatus(order, e.target.value as OrderStatus)}
                          className="w-32"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
                        <button
                          onClick={() => openDetail(order)}
                          className="p-2 text-content-muted hover:text-content hover:bg-surface-hover rounded-lg"
                          aria-label="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detail && (
        <Modal title={`Pedido ${detail.tracking_code}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Cliente" value={detail.customer_name} />
            <Info label="Email" value={detail.customer_email} />
            <Info label="Teléfono" value={detail.customer_phone || '—'} />
            <Info label="Estado" value={detail.status} />
          </div>

          {detail.notes && (
            <div className="bg-bg-subtle border border-line rounded-lg p-3">
              <p className="text-content-muted text-xs mb-1">Notas / Envío</p>
              <p className="text-content-soft text-sm whitespace-pre-line">{detail.notes}</p>
            </div>
          )}

          <div>
            <p className="text-content-muted text-xs mb-2">Productos</p>
            {detailLoading ? (
              <div className="flex items-center gap-2 text-content-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
              </div>
            ) : (
              <div className="space-y-2">
                {detailItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between bg-bg-subtle rounded-lg p-2.5 text-sm"
                  >
                    <span className="text-content-soft">
                      {item.product_name} <span className="text-content-muted">x{item.quantity}</span>
                    </span>
                    <span className="text-accent font-semibold">
                      {formatCurrency(item.subtotal || item.product_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-line">
            <span className="text-content font-semibold">Total</span>
            <span className="text-accent text-xl font-bold">
              {formatCurrency(detail.total_amount)}
            </span>
          </div>

          {detail.payment_proof_url ? (
            <a
              href={detail.payment_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover text-content py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver comprobante de pago
            </a>
          ) : (
            <p className="text-content-muted text-sm text-center">Sin comprobante de pago</p>
          )}

          <div>
            <p className="text-content-muted text-xs mb-2">Cambiar estado</p>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={detail.status === s ? 'primary' : 'secondary'}
                  onClick={() => changeStatus(detail, s)}
                  disabled={updatingId === detail.id}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-content-muted text-xs">{label}</p>
      <p className="text-content-soft capitalize">{value}</p>
    </div>
  );
}
