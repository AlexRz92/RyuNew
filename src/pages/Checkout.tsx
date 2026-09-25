import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Upload, Loader2, CheckCircle, Truck, ArrowLeft, Home, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CartItem } from '../lib/types';
import { states, getCitiesByState } from '../data/venezuelaData';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BankAccountsCarousel } from '../components/BankAccountsCarousel';
import {
  createOrder,
  uploadPaymentProof,
  cancelOrder,
  calculateShipping,
  type ShippingInfo,
} from '../services/orders';
import { getProfile, upsertProfile } from '../services/profile';
import { calculateTotals, formatCurrency } from '../lib/format';
import { storeConfig } from '../config/store.config';

interface CheckoutPageProps {
  items: CartItem[];
  onClearCart: () => void;
  isGuest?: boolean;
}

const SESSION_KEYS = {
  orderId: 'checkout_order_id',
  orderToken: 'checkout_order_token',
  trackingCode: 'checkout_tracking_code',
  orderCreated: 'checkout_order_created',
  proofUploaded: 'checkout_proof_uploaded',
};

export function Checkout({ items, onClearCart, isGuest = false }: CheckoutPageProps) {
  const navigate = useNavigate();
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
  const [hasPrefilledData, setHasPrefilledData] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderToken, setOrderToken] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = shippingInfo?.isFree ? 0 : shippingInfo?.cost || 0;
  const { tax, total } = calculateTotals(subtotal, shippingCost);
  const taxPercent = Math.round(storeConfig.finance.taxRate * 100);

  const availableCities = formData.state ? getCitiesByState(formData.state) : [];

  // Recupera el estado del checkout desde sessionStorage (sobrevive recargas).
  useEffect(() => {
    const savedOrderId = sessionStorage.getItem(SESSION_KEYS.orderId);
    const savedOrderToken = sessionStorage.getItem(SESSION_KEYS.orderToken);
    const savedTrackingCode = sessionStorage.getItem(SESSION_KEYS.trackingCode);

    if (savedOrderId && savedOrderToken && savedTrackingCode) {
      setOrderId(savedOrderId);
      setOrderToken(savedOrderToken);
      setTrackingCode(savedTrackingCode);
      if (sessionStorage.getItem(SESSION_KEYS.orderCreated) === 'true') setOrderCreated(true);
      if (sessionStorage.getItem(SESSION_KEYS.proofUploaded) === 'true') setProofUploaded(true);
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const profile = await getProfile(user.id);
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
      setHasPrefilledData(true);
    } else {
      setFormData((prev) => ({ ...prev, customer_email: user.email || '' }));
      setHasPrefilledData(false);
    }
  }, []);

  useEffect(() => {
    if (!isGuest) loadUserProfile();
  }, [isGuest, loadUserProfile]);

  // Calcula el envío cuando cambian estado/ciudad.
  useEffect(() => {
    const stateName = states.find((s) => s.code === formData.state)?.name;
    if (!stateName || !formData.city) {
      setShippingInfo(null);
      return;
    }
    let active = true;
    calculateShipping('Venezuela', stateName, formData.city, storeConfig.finance.currencySymbol)
      .then((info) => {
        if (active) setShippingInfo(info);
      })
      .catch(() => {
        if (active) setShippingInfo({ isFree: false, cost: 0, message: 'Envío por confirmar' });
      });
    return () => {
      active = false;
    };
  }, [formData.city, formData.state]);

  async function saveUserProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || isGuest) return;

    const stateName = states.find((s) => s.code === formData.state)?.name || formData.state;
    await upsertProfile({
      id: user.id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      cedula: formData.cedula,
      phone: formData.customer_phone,
      country: 'Venezuela',
      state: stateName,
      city: formData.city,
      address_line1: formData.address || null,
    });
  }

  const handleStateChange = (stateCode: string) => {
    setFormData({ ...formData, state: stateCode, city: '' });
    setShippingInfo(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const stateName = states.find((s) => s.code === formData.state)?.name || '';
      const result = await createOrder({
        customer_name: `${formData.first_name} ${formData.last_name}`,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone || undefined,
        country: 'Venezuela',
        state: stateName,
        city: formData.city,
        address: formData.address || undefined,
        cedula: formData.cedula,
        items,
      });

      await saveUserProfile().catch(() => undefined);

      setOrderId(result.order_id);
      setOrderToken(result.order_token);
      setTrackingCode(result.tracking_code);
      setOrderCreated(true);

      sessionStorage.setItem(SESSION_KEYS.orderId, result.order_id);
      sessionStorage.setItem(SESSION_KEYS.orderToken, result.order_token);
      sessionStorage.setItem(SESSION_KEYS.trackingCode, result.tracking_code);
      sessionStorage.setItem(SESSION_KEYS.orderCreated, 'true');

      onClearCart();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Hubo un error al procesar tu pedido. Por favor intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderId || !orderToken || !trackingCode) {
      setError('Error: falta información del pedido. Vuelve a la tienda e intenta de nuevo.');
      return;
    }
    if (!proofFile) {
      setError('Debes seleccionar una imagen del comprobante');
      return;
    }

    setUploadingProof(true);
    try {
      await uploadPaymentProof({ order_id: orderId, order_token: orderToken, file: proofFile });
      setProofFile(null);
      setProofPreview(null);
      setProofUploaded(true);
      sessionStorage.setItem(SESSION_KEYS.proofUploaded, 'true');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Hubo un error al subir el comprobante. Por favor intenta nuevamente.'
      );
    } finally {
      setUploadingProof(false);
    }
  };

  const cleanupCheckout = () => {
    Object.values(SESSION_KEYS).forEach((key) => sessionStorage.removeItem(key));
  };

  const handleCopyTracking = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopiedTracking(true);
      setRedirecting(true);
      setTimeout(() => {
        cleanupCheckout();
        navigate('/');
      }, 1800);
    } catch {
      setCopiedTracking(false);
      setRedirecting(false);
    }
  };

  const handleCancelOrderAndBack = async () => {
    setCancellingOrder(true);
    setError(null);
    try {
      await cancelOrder(orderId);
      cleanupCheckout();
      navigate('/');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Hubo un error al cancelar la orden. Por favor intenta nuevamente.'
      );
    } finally {
      setCancellingOrder(false);
    }
  };

  const handleBackToStore = () => {
    cleanupCheckout();
    navigate('/');
  };

  /* --------------------------- Carrito vacío --------------------------- */
  if (items.length === 0 && !orderCreated && !proofUploaded) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-8">
              <p className="text-slate-400 mb-6 text-lg">Tu carrito está vacío</p>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg transition-colors w-full font-semibold"
              >
                <Home className="w-5 h-5" />
                Volver a la tienda
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* ------------------------- Comprobante subido ------------------------ */
  if (proofUploaded) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-xl p-8 text-center shadow-2xl">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">¡Comprobante Recibido!</h2>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
                <p className="text-orange-400 font-semibold text-sm mb-2">¡IMPORTANTE!</p>
                <p className="text-slate-300 text-sm">Guarda este código para rastrear tu pedido</p>
              </div>

              <p className="text-slate-300 mb-3 font-semibold">Tu código de seguimiento:</p>
              <div className="bg-slate-900 border-2 border-amber-500/40 rounded-lg p-5 mb-4">
                <p className="text-amber-400 text-3xl font-bold tracking-wider">{trackingCode}</p>
              </div>

              {redirecting ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 font-semibold">Código copiado</p>
                  </div>
                  <p className="text-slate-300 text-sm mt-2">Redirigiendo a la tienda...</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleCopyTracking}
                    disabled={copiedTracking}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-lg transition-colors w-full mb-4 disabled:opacity-70"
                  >
                    {copiedTracking ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copiedTracking ? 'Copiando...' : 'Copiar código de seguimiento'}
                  </button>
                  <p className="text-slate-400 text-sm mb-6">
                    Copia el código y serás redirigido automáticamente a la tienda
                  </p>
                </>
              )}

              {!redirecting && (
                <button
                  onClick={handleBackToStore}
                  className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-lg transition-all w-full"
                >
                  <Home className="w-5 h-5" />
                  Volver a la tienda sin copiar
                </button>
              )}
            </div>
          </div>
        </main>
      </>
    );
  }

  /* --------------------- Orden creada: subir comprobante --------------- */
  if (orderCreated) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">¡Pedido Creado!</h2>
                <p className="text-slate-300">
                  Ahora necesitamos que subas el comprobante de transferencia
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-blue-400 font-semibold text-sm mb-2">Próximo paso</p>
                <p className="text-slate-300 text-sm">
                  Sube el comprobante de tu transferencia bancaria para completar tu pedido. Una vez
                  lo valides, recibirás tu número de seguimiento.
                </p>
              </div>

              <form onSubmit={handleUploadProof} className="space-y-6">
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
                  <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="proof-upload"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="proof-upload" className="cursor-pointer block">
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

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 flex-col sm:flex-row">
                  <button
                    type="button"
                    onClick={handleCancelOrderAndBack}
                    disabled={uploadingProof || cancellingOrder}
                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-lg transition-all flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancellingOrder ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <ArrowLeft className="w-5 h-5" />
                        Volver a la tienda
                      </>
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingProof || !proofFile || cancellingOrder}
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                  >
                    {uploadingProof ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      'Confirmar Comprobante'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* --------------------------- Formulario inicial ---------------------- */
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-8">
        <div className="container mx-auto px-4 max-w-6xl pb-12">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al carrito
            </button>
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            <form onSubmit={handleSubmitOrder} className="space-y-6 order-2 lg:order-1">
              <div className="bg-slate-900/50 border border-amber-500/20 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold text-lg">Datos de Facturación y Envío</h3>
                  {hasPrefilledData && <p className="text-xs text-slate-400">Datos desde tu perfil</p>}
                </div>

                {hasPrefilledData && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex justify-between items-center mb-4">
                    <p className="text-slate-300 text-sm">
                      Para modificar tus datos, ve a{' '}
                      <span className="text-blue-400 font-semibold">Mi Perfil</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/perfil')}
                      className="text-blue-400 hover:text-blue-300 text-sm font-semibold underline transition-colors whitespace-nowrap ml-2"
                    >
                      Ir a Mi Perfil
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nombre *">
                      <input
                        type="text"
                        required
                        readOnly={hasPrefilledData}
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className={inputClass(hasPrefilledData)}
                        placeholder="Juan"
                      />
                    </Field>
                    <Field label="Apellido *">
                      <input
                        type="text"
                        required
                        readOnly={hasPrefilledData}
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className={inputClass(hasPrefilledData)}
                        placeholder="Pérez"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Cédula *">
                      <input
                        type="text"
                        required
                        readOnly={hasPrefilledData}
                        value={formData.cedula}
                        onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                        className={inputClass(hasPrefilledData)}
                        placeholder="V-12345678"
                      />
                    </Field>
                    <Field label="Teléfono *">
                      <input
                        type="tel"
                        required
                        readOnly={hasPrefilledData}
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        className={inputClass(hasPrefilledData)}
                        placeholder="0424-1234567"
                      />
                    </Field>
                  </div>

                  <Field label="Email *">
                    <input
                      type="email"
                      required
                      readOnly={hasPrefilledData}
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      className={inputClass(hasPrefilledData)}
                      placeholder="juan@ejemplo.com"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Estado *">
                      <select
                        required
                        disabled={hasPrefilledData}
                        value={formData.state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className={inputClass(hasPrefilledData)}
                      >
                        <option value="">Seleccionar estado</option>
                        {states.map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Ciudad *">
                      <select
                        required
                        disabled={!formData.state || hasPrefilledData}
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className={inputClass(!formData.state || hasPrefilledData)}
                      >
                        <option value="">Seleccionar ciudad</option>
                        {availableCities.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Dirección (opcional)">
                    <textarea
                      readOnly={hasPrefilledData}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={`${inputClass(hasPrefilledData)} resize-none`}
                      rows={3}
                      placeholder="Calle, edificio, piso, apartamento..."
                    />
                  </Field>
                </div>
              </div>

              <BankAccountsCarousel />

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 font-semibold text-sm mb-2">Próximo paso</p>
                <p className="text-slate-300 text-sm">
                  Después de confirmar tu pedido, podrás subir el comprobante de tu transferencia
                  bancaria.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 flex-col sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-lg transition-all flex-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Volver a la tienda
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creando Pedido...
                    </>
                  ) : (
                    'Confirmar Pedido'
                  )}
                </button>
              </div>
            </form>

            <div className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-8">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-6 shadow-xl">
                  <h3 className="text-amber-400 font-semibold mb-4 text-lg">Resumen del Pedido</h3>

                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex justify-between text-sm pb-3 border-b border-slate-700"
                      >
                        <div className="flex-1 pr-2">
                          <p className="text-white font-medium">{item.product.name}</p>
                          <p className="text-slate-400 text-xs mt-1">Cantidad: {item.quantity}</p>
                        </div>
                        <span className="text-amber-400 font-semibold whitespace-nowrap">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-amber-500/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Subtotal</span>
                      <span className="text-white font-semibold">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">
                        {storeConfig.finance.taxLabel} ({taxPercent}%)
                      </span>
                      <span className="text-white font-semibold">{formatCurrency(tax)}</span>
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
                              <div className="text-white font-semibold">
                                {formatCurrency(shippingInfo.cost)}
                              </div>
                              <div className="text-xs text-slate-400">puede variar</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Por confirmar</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-amber-500/30">
                      <span className="text-white font-bold text-lg">Total a Pagar</span>
                      <span className="text-amber-400 font-bold text-2xl">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-slate-300 text-sm mb-2">{label}</label>
      {children}
    </div>
  );
}

function inputClass(disabled: boolean): string {
  return `w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none ${
    disabled ? 'opacity-60 cursor-not-allowed' : ''
  }`;
}
