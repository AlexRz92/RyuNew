import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  adminListShippingRules,
  adminCreateShippingRule,
  adminUpdateShippingRule,
  adminDeleteShippingRule,
} from '../../services/admin';
import { states, getCitiesByState } from '../../data/venezuelaData';
import { formatCurrency } from '../../lib/format';
import type { ShippingRule } from '../../lib/types';
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

type RuleForm = {
  state: string;
  city: string;
  is_free: boolean;
  base_cost: string;
  notes: string;
  is_active: boolean;
};

const emptyForm: RuleForm = {
  state: '',
  city: '',
  is_free: false,
  base_cost: '',
  notes: '',
  is_active: true,
};

export function ShippingAdmin() {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setRules(await adminListShippingRules());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reglas de envío');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function stateCodeFromName(name: string) {
    return states.find((s) => s.name === name)?.code ?? '';
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(rule: ShippingRule) {
    setEditingId(rule.id);
    setForm({
      state: stateCodeFromName(rule.state),
      city: rule.city,
      is_free: rule.is_free,
      base_cost: String(rule.base_cost),
      notes: rule.notes ?? '',
      is_active: rule.is_active,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const stateName = states.find((s) => s.code === form.state)?.name ?? form.state;
      const payload = {
        country: 'Venezuela',
        state: stateName,
        city: form.city,
        is_free: form.is_free,
        base_cost: form.is_free ? 0 : Number(form.base_cost) || 0,
        cost_per_km: 0,
        notes: form.notes || null,
        is_active: form.is_active,
      };
      if (editingId) await adminUpdateShippingRule(editingId, payload);
      else await adminCreateShippingRule(payload);
      setModalOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la regla');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rule: ShippingRule) {
    if (!confirm(`¿Eliminar la regla de envío para ${rule.city}?`)) return;
    try {
      await adminDeleteShippingRule(rule.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la regla');
    }
  }

  const cities = form.state ? getCitiesByState(form.state) : [];

  return (
    <div>
      <PageHeader
        title="Reglas de envío"
        description="Define el costo de envío por ciudad"
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nueva regla
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <Card className="overflow-hidden">
        {loading ? (
          <p className="text-content-muted p-6">Cargando...</p>
        ) : rules.length === 0 ? (
          <EmptyState message="No hay reglas de envío. Crea la primera." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-content-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Estado</th>
                  <th className="text-left p-3 font-medium">Ciudad</th>
                  <th className="text-left p-3 font-medium">Costo</th>
                  <th className="text-center p-3 font-medium">Activo</th>
                  <th className="text-right p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-t border-line">
                    <td className="p-3 text-content-soft">{rule.state}</td>
                    <td className="p-3 text-content font-medium">{rule.city}</td>
                    <td className="p-3">
                      {rule.is_free ? (
                        <span className="text-green-400 font-semibold">Gratis</span>
                      ) : (
                        <span className="text-accent font-semibold">
                          {formatCurrency(rule.base_cost)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          rule.is_active ? 'bg-green-400/10 text-green-400' : 'bg-surface-hover text-content-muted'
                        }`}
                      >
                        {rule.is_active ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(rule)}
                          className="p-2 text-content-muted hover:text-content hover:bg-surface-hover rounded-lg"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
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
          title={editingId ? 'Editar regla' : 'Nueva regla de envío'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.state || !form.city}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estado *">
              <Select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value, city: '' })}
              >
                <option value="">Seleccionar</option>
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ciudad *">
              <Select
                value={form.city}
                disabled={!form.state}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-content-soft text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_free}
              onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
              className="w-4 h-4 accent-brand"
            />
            Envío gratis
          </label>

          {!form.is_free && (
            <Field label="Costo base">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.base_cost}
                onChange={(e) => setForm({ ...form, base_cost: e.target.value })}
              />
            </Field>
          )}

          <Field label="Notas">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>

          <label className="flex items-center gap-2 text-content-soft text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 accent-brand"
            />
            Activa
          </label>
        </Modal>
      )}
    </div>
  );
}
