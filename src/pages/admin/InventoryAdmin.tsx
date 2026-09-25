import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { adminListProducts, adminListInventory, adminSetStock } from '../../services/admin';
import type { Product } from '../../lib/types';
import { PageHeader, Card, Button, Input, EmptyState, ErrorBanner } from './ui';

interface Row {
  product: Product;
  quantity: number;
  original: number;
  saving: boolean;
}

export function InventoryAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function reload() {
    setLoading(true);
    try {
      const [products, inventory] = await Promise.all([adminListProducts(), adminListInventory()]);
      const stockMap = new Map(inventory.map((i) => [i.product_id, i.quantity]));
      setRows(
        products.map((product) => {
          const qty = stockMap.get(product.id) ?? 0;
          return { product, quantity: qty, original: qty, saving: false };
        })
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function setQuantity(productId: string, value: number) {
    setRows((prev) =>
      prev.map((r) => (r.product.id === productId ? { ...r, quantity: Math.max(0, value) } : r))
    );
  }

  async function save(productId: string) {
    const row = rows.find((r) => r.product.id === productId);
    if (!row) return;
    setRows((prev) => prev.map((r) => (r.product.id === productId ? { ...r, saving: true } : r)));
    try {
      await adminSetStock(productId, row.quantity);
      setRows((prev) =>
        prev.map((r) =>
          r.product.id === productId ? { ...r, original: row.quantity, saving: false } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el stock');
      setRows((prev) => prev.map((r) => (r.product.id === productId ? { ...r, saving: false } : r)));
    }
  }

  const filtered = rows.filter((r) =>
    r.product.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Inventario" description="Ajusta las existencias de cada producto" />

      {error && <ErrorBanner message={error} />}

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="text-slate-400 p-6">Cargando...</p>
        ) : filtered.length === 0 ? (
          <EmptyState message="Sin productos" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="text-left p-3 font-medium">Producto</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">SKU</th>
                  <th className="text-left p-3 font-medium w-40">Stock</th>
                  <th className="text-right p-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const changed = row.quantity !== row.original;
                  return (
                    <tr key={row.product.id} className="border-t border-slate-800">
                      <td className="p-3 text-white font-medium">{row.product.name}</td>
                      <td className="p-3 text-slate-400 hidden sm:table-cell">{row.product.sku}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          value={row.quantity}
                          onChange={(e) => setQuantity(row.product.id, Number(e.target.value))}
                          className="w-28"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant={changed ? 'primary' : 'ghost'}
                          disabled={!changed || row.saving}
                          onClick={() => save(row.product.id)}
                        >
                          {row.saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Guardar
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
