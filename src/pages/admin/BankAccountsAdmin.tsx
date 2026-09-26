import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  adminListBankAccounts,
  adminCreateBankAccount,
  adminUpdateBankAccount,
  adminDeleteBankAccount,
} from '../../services/admin';
import { useConfirm } from '../../contexts/ConfirmContext';
import type { BankAccount } from '../../lib/types';
import {
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
  Field,
  Modal,
  EmptyState,
  ErrorBanner,
} from './ui';

type AccountForm = {
  label: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  document_id: string;
  account_type: string;
  notes: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: AccountForm = {
  label: '',
  bank_name: '',
  account_holder: '',
  account_number: '',
  document_id: '',
  account_type: '',
  notes: '',
  sort_order: '0',
  is_active: true,
};

export function BankAccountsAdmin() {
  const confirm = useConfirm();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setAccounts(await adminListBankAccounts());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(account: BankAccount) {
    setEditingId(account.id);
    setForm({
      label: account.label,
      bank_name: account.bank_name,
      account_holder: account.account_holder,
      account_number: account.account_number,
      document_id: account.document_id,
      account_type: account.account_type ?? '',
      notes: account.notes ?? '',
      sort_order: String(account.sort_order),
      is_active: account.is_active,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        label: form.label,
        bank_name: form.bank_name,
        account_holder: form.account_holder,
        account_number: form.account_number,
        document_id: form.document_id,
        account_type: form.account_type || null,
        notes: form.notes || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };
      if (editingId) await adminUpdateBankAccount(editingId, payload);
      else await adminCreateBankAccount(payload);
      setModalOpen(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la cuenta');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(account: BankAccount) {
    const ok = await confirm({
      title: 'Eliminar cuenta bancaria',
      message: `¿Eliminar la cuenta "${account.label}"?`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminDeleteBankAccount(account.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuenta');
    }
  }

  return (
    <div>
      <PageHeader
        title="Cuentas bancarias"
        description="Datos de transferencia que ven los clientes en el checkout"
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nueva cuenta
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <p className="text-content-muted">Cargando...</p>
      ) : accounts.length === 0 ? (
        <Card>
          <EmptyState message="No hay cuentas bancarias. Crea la primera." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="text-accent font-semibold">{account.label}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(account)}
                    className="p-2 text-content-muted hover:text-content hover:bg-surface-hover rounded-lg"
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm space-y-1 text-content-soft">
                <p>{account.bank_name}</p>
                <p>{account.account_holder}</p>
                <p className="font-mono">{account.account_number}</p>
                <p className="text-content-muted">{account.document_id}</p>
              </div>
              {!account.is_active && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-surface-hover text-content-muted">
                  Inactiva
                </span>
              )}
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingId ? 'Editar cuenta' : 'Nueva cuenta bancaria'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.label || !form.bank_name}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
              </Button>
            </>
          }
        >
          <Field label="Etiqueta * (ej: Banco Principal)">
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </Field>
          <Field label="Banco *">
            <Input
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            />
          </Field>
          <Field label="Titular">
            <Input
              value={form.account_holder}
              onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Número de cuenta / teléfono">
              <Input
                value={form.account_number}
                onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              />
            </Field>
            <Field label="Cédula / RIF">
              <Input
                value={form.document_id}
                onChange={(e) => setForm({ ...form, document_id: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de cuenta">
              <Input
                value={form.account_type}
                onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                placeholder="Corriente / Ahorro / Pago móvil"
              />
            </Field>
            <Field label="Orden">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </Field>
          </div>
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
            Activa (visible en el checkout)
          </label>
        </Modal>
      )}
    </div>
  );
}
