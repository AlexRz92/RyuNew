import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { adminListProducts, adminListOrders, adminListInventory } from '../../services/admin';
import { formatCurrency } from '../../lib/format';
import { PageHeader, Card, EmptyState } from './ui';
import type { Order } from '../../lib/types';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    pending: 0,
    revenue: 0,
    lowStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([adminListProducts(), adminListOrders(), adminListInventory()])
      .then(([products, orders, inventory]) => {
        if (!active) return;
        const pending = orders.filter((o) => o.status === 'pending').length;
        const revenue = orders
          .filter((o) => o.status === 'completed' || o.status === 'confirmed')
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const lowStock = inventory.filter((i) => i.quantity <= 5).length;
        setStats({ products: products.length, orders: orders.length, pending, revenue, lowStock });
        setRecentOrders(orders.slice(0, 5));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const cards = [
    { label: 'Productos', value: stats.products, icon: Package, color: 'text-blue-400' },
    { label: 'Pedidos totales', value: stats.orders, icon: ShoppingCart, color: 'text-accent' },
    { label: 'Pedidos pendientes', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
    { label: 'Ingresos (conf./compl.)', value: formatCurrency(stats.revenue), icon: DollarSign, color: 'text-green-400' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general de la tienda" />

      {loading ? (
        <p className="text-content-muted">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {cards.map((card) => (
              <Card key={card.label} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-content-muted text-sm">{card.label}</p>
                    <p className="text-2xl font-bold text-content mt-1">{card.value}</p>
                  </div>
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </Card>
            ))}
          </div>

          {stats.lowStock > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-sm">
                {stats.lowStock} producto(s) con stock bajo (≤ 5 unidades). Revisa el inventario.
              </p>
            </div>
          )}

          <Card className="p-5">
            <h2 className="text-content font-semibold mb-4">Pedidos recientes</h2>
            {recentOrders.length === 0 ? (
              <EmptyState message="Aún no hay pedidos" />
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between bg-bg-subtle rounded-lg p-3 text-sm"
                  >
                    <span className="text-content font-medium">{order.tracking_code}</span>
                    <span className="text-content-muted">{order.customer_name}</span>
                    <span className="text-accent font-semibold">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
