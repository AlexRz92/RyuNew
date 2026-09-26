import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { getStoreSettings, updateStoreSettings } from '../../services/settings';
import type { StoreSettings } from '../../lib/types';
import { PageHeader, Card, Button, Input, Field, EmptyState, ErrorBanner } from './ui';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';

export function SettingsAdmin() {
  const { showToast } = useToast();
  const { reload: reloadSettings } = useSettings();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de la calculadora

  useEffect(() => {
    getStoreSettings()
      .then(setSettings)
      .catch(() => setError('No se pudo cargar la configuración'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await updateStoreSettings({
        require_cedula: settings.require_cedula,
        require_rif: settings.require_rif,
        enable_2fa: settings.enable_2fa,
        fuel_price: settings.fuel_price,
        vehicle_kml: settings.vehicle_kml,
        shipping_margin: settings.shipping_margin,
        round_trip: settings.round_trip,
      });
      reloadSettings();
      showToast('Configuración guardada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar. ¿Ejecutaste la migración de store_settings?');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Configuración" />
        <p className="text-content-muted">Cargando...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div>
        <PageHeader title="Configuración" />
        <Card>
          <EmptyState message="No se pudo cargar la configuración." />
        </Card>
      </div>
    );
  }

  const marginPct = Math.round(settings.shipping_margin * 100);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Configuración"
        description="Ajustes generales de la tienda"
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Campos que pide la tienda */}
      <Card className="p-5 mb-6">
        <h2 className="text-content font-semibold mb-4">Datos solicitados al cliente</h2>
        <div className="space-y-3">
          <Toggle
            label="Pedir cédula"
            description="Solicitar el número de cédula al comprar/registrarse."
            checked={settings.require_cedula}
            onChange={(v) => setSettings({ ...settings, require_cedula: v })}
          />
          <Toggle
            label="Pedir RIF"
            description="Útil para negocios que facturan (ferretería). Una pizzería puede dejarlo apagado."
            checked={settings.require_rif}
            onChange={(v) => setSettings({ ...settings, require_rif: v })}
          />
          <Toggle
            label="Habilitar autenticación en dos pasos (2FA)"
            description="Permite a los clientes proteger su cuenta con un código de app tipo Google Authenticator."
            checked={settings.enable_2fa}
            onChange={(v) => setSettings({ ...settings, enable_2fa: v })}
          />
        </div>
      </Card>

      {/* Parámetros de envío */}
      <Card className="p-5 mb-6">
        <h2 className="text-content font-semibold mb-1">Parámetros de envío (gasolina)</h2>
        <p className="text-content-muted text-sm mb-4">
          Se usan en la calculadora de abajo para sugerir el costo de envío por ciudad.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio del combustible (por litro)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={settings.fuel_price}
              onChange={(e) => setSettings({ ...settings, fuel_price: Number(e.target.value) })}
            />
          </Field>
          <Field label="Rendimiento del vehículo (km por litro)">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={settings.vehicle_kml}
              onChange={(e) => setSettings({ ...settings, vehicle_kml: Number(e.target.value) })}
            />
          </Field>
          <Field label="Margen de ganancia (%)">
            <Input
              type="number"
              step="1"
              min="0"
              value={marginPct}
              onChange={(e) =>
                setSettings({ ...settings, shipping_margin: (Number(e.target.value) || 0) / 100 })
              }
            />
          </Field>
          <Field label="¿Cobrar ida y vuelta?">
            <div className="pt-2">
              <Toggle
                label={settings.round_trip ? 'Sí (ida y vuelta)' : 'No (solo ida)'}
                checked={settings.round_trip}
                onChange={(v) => setSettings({ ...settings, round_trip: v })}
              />
            </div>
          </Field>
        </div>
      </Card>

      <p className="text-content-muted text-sm">
        La calculadora de costo de envío está en la sección{' '}
        <span className="text-content font-medium">Envíos</span>, que es donde defines las reglas por
        ciudad.
      </p>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-brand' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
      <div>
        <p className="text-content text-sm font-medium">{label}</p>
        {description && <p className="text-content-muted text-xs mt-0.5">{description}</p>}
      </div>
    </label>
  );
}
