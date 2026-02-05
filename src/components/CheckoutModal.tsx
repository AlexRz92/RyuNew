import { useState, useEffect } from 'react';
import { X, Upload, Loader2, CheckCircle, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CartItem } from './Cart';
import { states, getCitiesByState } from '../data/venezuelaData';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSuccess: () => void;
  isGuest?: boolean;
}

export function CheckoutModal({ isOpen, onClose, items, onSuccess, isGuest = false }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    cedula: '',
    customer_email: '',
    customer_phone: '',
    state: '',
    city: '',
    address: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState<{
    isFree: boolean;
    cost: number;
    message: string;
  } | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = shippingInfo?.isFree ? 0 : shippingInfo?.cost || 0;
  const total = subtotal + shippingCost;

  const availableCities = formData.state ? getCitiesByState(formData.state) : [];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !success) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, success]);

  useEffect(() => {
    if (isOpen) {
      setProofFile(null);
      setProofPreview(null);
      setError(null);
      setSuccess(false);
      setTrackingCode('');
      if (isGuest) {
        setFormData({
          first_name: '',
          last_name: '',
          cedula: '',
          customer_email: '',
          customer_phone: '',
          state: '',
          city: '',
          address: '',
        });
      } else {
        loadUserProfile();
      }
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        cedula: '',
        customer_email: '',
        customer_phone: '',
        state: '',
        city: '',
        address: '',
      });
      setProofFile(null);
      setProofPreview(null);
      setShippingInfo(null);
      setError(null);
      setSuccess(false);
      setTrackingCode('');
    }
  }, [isOpen, isGuest]);

  useEffect(() => {
    if (formData.city && formData.state) {
      calculateShipping();
    } else {
      setShippingInfo(null);
    }
  }, [formData.city, formData.state]);

  async function loadUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const stateCode = states.find((s) => s.name === profile.state)?.code || '';

          setFormData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            cedula: profile.cedula || '',
            customer_email: user.email || '',
            customer_phone: profile.phone || '',
            state: stateCode,
            city: profile.city || '',
            address: profile.address_line1 || '',
          });
        } else {
          setFormData(prev => ({ ...prev, customer_email: user.email || '' }));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async function saveUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || isGuest) return;

      const stateName = states.find((s) => s.code === formData.state)?.name || formData.state;

      const profileData = {
        id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        cedula: formData.cedula,
        phone: formData.customer_phone,
        country: 'Venezuela',
        state: stateName,
        city: formData.city,
        address_line1: formData.address || null,
      };

      const { error } = await supabase
        .from('customer_profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) {
        console.error('Error saving profile:', error);
      }
    } catch (error) {
      console.error('Error in saveUserProfile:', error);
    }
  }

  async function calculateShipping() {
    try {
      const stateName = states.find((s) => s.code === formData.state)?.name;

      if (!stateName || !formData.city) {
        setShippingInfo(null);
        return;
      }

      const { data: rule } = await supabase
        .from('shipping_rules')
        .select('*')
        .eq('country', 'Venezuela')
        .eq('state', stateName)
        .eq('city', formData.city)
        .eq('is_active', true)
        .maybeSingle();

      if (rule) {
        setShippingInfo({
          isFree: rule.is_free,
          cost: rule.base_cost,
          message: rule.is_free
            ? 'Envío gratis'
            : `$${rule.base_cost.toFixed(2)} (puede variar según la distancia)`,
        });
      } else {
        setShippingInfo({
          isFree: false,
          cost: 0,
          message: 'Envío por confirmar',
        });
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      setShippingInfo({
        isFree: false,
        cost: 0,
        message: 'Envío por confirmar',
      });
    }
  }

  const handleStateChange = (stateCode: string) => {
    setFormData({ ...formData, state: stateCode, city: '' });
    setShippingInfo(null);
  };

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
      if (!proofFile) {
        setError('Debes seleccionar una imagen del comprobante');
        setLoading(false);
        return;
      }

      const fileExt = proofFile.name.split('.').pop();
      const tempFilePath = `temp/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('transfer-proofs')
        .upload(tempFilePath, proofFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error('Error al subir el comprobante. Por favor intenta nuevamente.');
      }

      const { data: urlData } = supabase.storage
        .from('transfer-proofs')
        .getPublicUrl(tempFilePath);

      const { data: { user } } = await supabase.auth.getUser();

      const customerName = `${formData.first_name} ${formData.last_name}`;
      const stateName = states.find((s) => s.code === formData.state)?.name || '';

      const orderPayload = {
        customer_name: customerName,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone || undefined,
        country: 'Venezuela',
        state: stateName,
        city: formData.city,
        address: formData.address || undefined,
        cedula: formData.cedula,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_proof_url: urlData.publicUrl,
      };

      let authHeader = '';
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          authHeader = `Bearer ${session.access_token}`;
        }
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const createOrderUrl = `${supabaseUrl}/functions/v1/create-order`;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Client-Info': 'supabase-js/2.57.4',
        'Apikey': anonKey,
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch(createOrderUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la orden');
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || 'Error al crear la orden');
      }

      await saveUserProfile();

      setError(null);
      setTrackingCode(responseData.tracking_code);
      setSuccess(true);
      setProofFile(null);
      setProofPreview(null);
    } catch (err) {
      console.error('Error in checkout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Hubo un error al procesar tu pedido. Por favor intenta nuevamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  const handleConfirmTracking = () => {
    onSuccess();
    onClose();
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">¡Pedido Confirmado!</h2>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
            <p className="text-orange-400 font-semibold text-sm mb-2">¡IMPORTANTE!</p>
            <p className="text-slate-300 text-sm">
              Guarda este código para rastrear tu pedido
            </p>
          </div>

          <p className="text-slate-300 mb-3 font-semibold">Tu código de seguimiento:</p>
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-lg p-5 mb-6">
            <p className="text-amber-400 text-3xl font-bold tracking-wider">{trackingCode}</p>
          </div>

          <p className="text-slate-400 text-sm mb-6">
            Necesitarás este código para consultar el estado de tu pedido en cualquier momento.
          </p>

          <button
            onClick={handleConfirmTracking}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50"
          >
            OK, ya copié mi código
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-6 border-b border-amber-500/20 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Finalizar Compra</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
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
            <div className="space-y-2 pt-3 border-t border-amber-500/20">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Subtotal</span>
                <span className="text-white font-semibold">${subtotal.toFixed(2)}</span>
              </div>

              {shippingInfo && (
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300">Envío</span>
                  </div>
                  <div className="text-right">
                    {shippingInfo.isFree ? (
                      <span className="text-green-400 font-semibold">Gratis</span>
                    ) : shippingInfo.cost > 0 ? (
                      <div>
                        <div className="text-white font-semibold">${shippingInfo.cost.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">puede variar</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Por confirmar</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-amber-500/20">
                <span className="text-white font-bold text-lg">Total</span>
                <span className="text-amber-400 font-bold text-2xl">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Datos de Facturación y Envío</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Juan"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Apellido *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Pérez"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Cédula *</label>
                <input
                  type="text"
                  required
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="V-12345678"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Teléfono *</label>
                <input
                  type="tel"
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="0424-1234567"
                />
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Estado *</label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Seleccionar estado</option>
                  {states.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Ciudad *</label>
                <select
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!formData.state}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccionar ciudad</option>
                  {availableCities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Dirección (opcional)</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none resize-none"
                rows={3}
                placeholder="Calle, edificio, piso, apartamento..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Comprobante de Transferencia</h3>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <p className="text-orange-400 font-semibold mb-1">¡Importante!</p>
              <p className="text-slate-300 text-sm">
                Debes subir una captura del comprobante de transferencia
              </p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2 font-semibold">
                Captura de Pantalla del Comprobante *
              </label>
              <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="proof-upload-checkout"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="proof-upload-checkout" className="cursor-pointer block">
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
                    {proofPreview ? 'Cambiar imagen' : 'Selecciona una imagen (JPG, PNG o WEBP)'}
                  </p>
                </label>
              </div>
            </div>
          </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !proofFile}
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
          </div>
        </form>
      </div>
    </div>
  );
}
