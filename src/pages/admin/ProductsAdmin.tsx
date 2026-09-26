import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import {
  adminListProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminListCategories,
} from '../../services/admin';
import { formatCurrency } from '../../lib/format';
import { useConfirm } from '../../contexts/ConfirmContext';
import type { Category, Product } from '../../lib/types';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Field,
  Modal,
  EmptyState,
  ErrorBanner,
} from './ui';

type ProductForm = {
  name: string;
  description: string;
  price: string;
  sku: string;
  image_url: string;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
};

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  sku: '',
  image_url: '',
  category_id: '',
  is_active: true,
  is_featured: false,
};

export function ProductsAdmin() {
  const confirm = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([adminListProducts(), adminListCategories()]);
      setProducts(prods);
      setCategories(cats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, category_id: categories[0]?.id ?? '' });
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      sku: product.sku,
      image_url: product.image_url,
      category_id: product.category_id,
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        sku: form.sku,
        image_url: form.image_url,
        category_id: form.category_id,
        is_active: form.is_active,
        is_featured: form.is_featured,
      };
      if (editingId) {
        await adminUpdateProduct(editingId, payload);
      } else {
        await adminCreateProduct(payload);
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    const ok = await confirm({
      title: 'Eliminar producto',
      message: `¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminDeleteProduct(product.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el producto');
    }
  }

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de productos"
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nuevo producto
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <Card className="overflow-hidden">
        {loading ? (
          <p className="text-content-muted p-6">Cargando...</p>
        ) : products.length === 0 ? (
          <EmptyState message="No hay productos. Crea el primero." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-content-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Producto</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Categoría</th>
                  <th className="text-left p-3 font-medium">Precio</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">SKU</th>
                  <th className="text-center p-3 font-medium">Estado</th>
                  <th className="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-line hover:bg-surface-hover">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {product.is_featured && (
                          <Star className="w-4 h-4 text-accent fill-accent flex-shrink-0" />
                        )}
                        <span className="text-content font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-content-muted hidden md:table-cell">
                      {categoryName(product.category_id)}
                    </td>
                    <td className="p-3 text-accent font-semibold">{formatCurrency(product.price)}</td>
                    <td className="p-3 text-content-muted hidden sm:table-cell">{product.sku}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          product.is_active
                            ? 'bg-green-400/10 text-green-400'
                            : 'bg-surface-hover text-content-muted'
                        }`}
                      >
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 text-content-muted hover:text-content hover:bg-surface-hover rounded-lg"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {modalOpen && (
        <Modal
          title={editingId ? 'Editar producto' : 'Nuevo producto'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.category_id}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
              </Button>
            </>
          }
        >
          <Field label="Nombre *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="SKU">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Field>
          </div>
          <Field label="Categoría *">
            <Select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="URL de imagen">
            <Input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
            />
          </Field>
          {form.image_url && (
            <img
              src={form.image_url}
              alt="Vista previa"
              className="w-24 h-24 object-cover rounded-lg border border-line"
            />
          )}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-content-soft text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 accent-brand"
              />
              Activo
            </label>
            <label className="flex items-center gap-2 text-content-soft text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="w-4 h-4 accent-brand"
              />
              Destacado
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
