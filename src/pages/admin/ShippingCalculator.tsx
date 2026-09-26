import { useEffect, useState } from 'react';
import { Calculator, MapPin } from 'lucide-react';
import { getStoreSettings, estimateShippingCost } from '../../services/settings';
import { formatCurrency } from '../../lib/format';
import type { StoreSettings } from '../../lib/types';
import { Card, Input, Field } from './ui';

/**
 * Calculadora de costo de envío por consumo de gasolina.
 * Se apoya en los parámetros configurados en la sección Configuración
 * (precio de combustible, rendimiento km/L, margen, ida y vuelta).
 */
export function ShippingCalculator() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [distance, setDistance] = useState('');

  useEffect(() => {
    getStoreSettings().then(setSettings);
  }, []);

  if (!settings) return null;

  const estimated = distance ? estimateShippingCost(Number(distance) || 0, settings) : 0;
  const marginPct = Math.round(settings.shipping_margin * 100);

  return (
    <Card className="p-5 mb-6">
      <h2 className="text-content font-semibold mb-1 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-brand" />
        Calculadora de costo de envío
      </h2>
      <p className="text-content-muted text-sm mb-4">
        Ingresa la distancia (km) desde tu punto de partida hasta la ciudad de destino. El resultado
        es el costo sugerido que puedes poner en la regla de envío de esa ciudad.
      </p>

      <div className="flex items-end gap-4 flex-wrap">
        <Field label="Distancia hasta el destino (km)">
          <Input
            type="number"
            step="1"
            min="0"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="Ej: 120"
            className="w-40"
          />
        </Field>
        <div className="bg-brand-soft rounded-lg px-5 py-3">
          <p className="text-content-muted text-xs">Costo sugerido</p>
          <p className="text-content text-2xl font-bold tracking-tight">{formatCurrency(estimated)}</p>
        </div>
      </div>

      {distance && Number(distance) > 0 && (
        <p className="text-content-muted text-xs mt-3">
          Cálculo: {distance} km {settings.round_trip ? '× 2 (ida y vuelta)' : '(solo ida)'} ÷{' '}
          {settings.vehicle_kml} km/L × {formatCurrency(settings.fuel_price)}/L + {marginPct}% de margen.
        </p>
      )}

      {/* Ayuda para medir la distancia con Google Maps */}
      <div className="mt-4 pt-4 border-t border-line">
        <a
          href="https://www.google.com/maps/dir/?api=1&origin=Miranda,Venezuela"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-brand hover:text-brand-hover text-sm font-medium"
        >
          <MapPin className="w-4 h-4" />
          Medir distancia en Google Maps
        </a>
        <p className="text-content-muted text-xs mt-1">
          Se abre Google Maps con el origen puesto; escribe el destino y te dará los km para copiarlos aquí.
        </p>
      </div>
    </Card>
  );
}
