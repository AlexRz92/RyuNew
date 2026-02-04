import { useState } from 'react';
import { Search, Package, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface OrderTracking {
  tracking_code: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  total_amount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  confirmed: {
    label: 'Confirmado',
    icon: CheckCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  completed: {
    label: 'Completado',
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
};

export function TrackOrder() {
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderTracking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-order`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ tracking_code: trackingCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar el pedido');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white">Rastrear Pedido</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
            placeholder="Ingresa tu código de seguimiento"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading || !trackingCode.trim()}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-amber-500/20">
            <div>
              <h3 className="text-amber-400 text-sm font-semibold mb-1">Código de Seguimiento</h3>
              <p className="text-white text-2xl font-bold tracking-wider">{result.tracking_code}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig[result.status].bg}`}>
              {(() => {
                const StatusIcon = statusConfig[result.status].icon;
                return <StatusIcon className={`w-5 h-5 ${statusConfig[result.status].color}`} />;
              })()}
              <span className={`font-semibold ${statusConfig[result.status].color}`}>
                {statusConfig[result.status].label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total</p>
              <p className="text-amber-400 font-bold text-xl">${result.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Fecha de Pedido</p>
              <p className="text-white">{new Date(result.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Productos</h4>
            <div className="space-y-3">
              {result.items.map((item, index) => (
                <div key={index} className="bg-slate-900/50 border border-amber-500/10 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-semibold flex-1">{item.name}</p>
                    <p className="text-amber-400 font-bold">${(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <p className="text-slate-400">Cantidad: {item.quantity}</p>
                    <p className="text-slate-400">${item.price.toFixed(2)} c/u</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
