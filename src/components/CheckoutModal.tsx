import { useState } from 'react';
import { X, Upload, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CartItem } from './Cart';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSuccess: () => void;
}

export function CheckoutModal({ isOpen, onClose, items, onSuccess }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let proofUrl = null;

      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `payment-proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, proofFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath);

        proofUrl = urlData.publicUrl;
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone || null,
          payment_method: 'transfer',
          payment_proof_url: proofUrl,
          total_amount: total,
          status: 'pending',
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku,
        product_price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setTrackingCode(orderData.tracking_code);
      setSuccess(true);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Hubo un error al procesar tu pedido. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">¡Pedido Confirmado!</h2>
          <p className="text-slate-300 mb-4">Tu código de seguimiento es:</p>
          <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-4 mb-4">
            <p className="text-amber-400 text-2xl font-bold tracking-wider">{trackingCode}</p>
          </div>
          <p className="text-slate-400 text-sm">
            Recibirás un correo de confirmación con los detalles de tu pedido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-amber-500/20">
          <h2 className="text-2xl font-bold text-white">Finalizar Compra</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-900/50 border border-amber-500/20 rounded-lg p-4">
            <h3 className="text-amber-400 font-semibold mb-3">Resumen del Pedido</h3>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="text-white font-semibold">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-amber-500/20">
              <span className="text-white font-bold text-lg">Total</span>
              <span className="text-amber-400 font-bold text-2xl">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Información de Contacto</h3>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Nombre Completo *</label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                placeholder="juan@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Teléfono</label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                placeholder="(123) 456-7890"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Notas (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none resize-none"
                rows={3}
                placeholder="Dirección de entrega u otras indicaciones..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Comprobante de Transferencia</h3>
            <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
              <input
                type="file"
                id="proof-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                {proofPreview ? (
                  <img
                    src={proofPreview}
                    alt="Comprobante"
                    className="max-h-48 mx-auto rounded-lg mb-3"
                  />
                ) : (
                  <Upload className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                )}
                <p className="text-slate-400 text-sm">
                  {proofPreview ? 'Cambiar imagen' : 'Sube tu comprobante de pago'}
                </p>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              'Confirmar Pedido'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
