import { useState, useEffect } from 'react';
import { Upload, Loader2, CheckCircle, Truck, ArrowLeft, Home, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CartItem } from '../components/Cart';
import { states, getCitiesByState } from '../data/venezuelaData';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { BankAccountsCarousel } from '../components/BankAccountsCarousel';

interface CheckoutPageProps {
  items: CartItem[];
  onClearCart: () => void;
  isGuest?: boolean;
}

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
  const [shippingInfo, setShippingInfo] = useState<{
    isFree: boolean;
    cost: number;
    message: string;
  } | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const iva = subtotal * 0.19;
  const shippingCost = shippingInfo?.isFree ? 0 : shippingInfo?.cost || 0;
  const total = subtotal + iva + shippingCost;

  const availableCities = formData.state ? getCitiesByState(formData.state) : [];

  useEffect(() => {
    const savedOrderId = sessionStorage.getItem('checkout_order_id');
    const savedOrderToken = sessionStorage.getItem('checkout_order_token');
    const savedTrackingCode = sessionStorage.getItem('checkout_tracking_code');
    const savedOrderCreated = sessionStorage.getItem('checkout_order_created');
    const savedProofUploaded = sessionStorage.getItem('checkout_proof_uploaded');

    console.log('[useEffect] Recuperando datos de sessionStorage:', {
      savedOrderId: savedOrderId ? 'presente' : 'ausente',
      savedOrderToken: savedOrderToken ? 'presente' : 'ausente',
      savedTrackingCode: savedTrackingCode ? 'presente' : 'ausente',
      savedOrderCreated,
      savedProofUploaded
    });

    if (savedOrderId && savedOrderToken && savedTrackingCode) {
      setOrderId(savedOrderId);
      setOrderToken(savedOrderToken);
      setTrackingCode(savedTrackingCode);
      if (savedOrderCreated === 'true') {
        setOrderCreated(true);
      }
      if (savedProofUploaded === 'true') {
        setProofUploaded(true);
      }
      console.log('[useEffect] Estado actualizado con datos guardados');
    } else {
      console.log('[useEffect] No se encontraron datos guardados en sessionStorage');
    }
  }, []);

  useEffect(() => {
    if (!isGuest) {
      loadUserProfile();
    }
  }, [isGuest]);

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
          setHasPrefilledData(true);
        } else {
          setFormData(prev => ({ ...prev, customer_email: user.email || '' }));
          setHasPrefilledData(false);
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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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
      setOrderId(responseData.order_id);
      setOrderToken(responseData.order_token);
      setTrackingCode(responseData.tracking_code);
      setOrderCreated(true);

      sessionStorage.setItem('checkout_order_id', responseData.order_id);
      sessionStorage.setItem('checkout_order_token', responseData.order_token);
      sessionStorage.setItem('checkout_tracking_code', responseData.tracking_code);
      sessionStorage.setItem('checkout_order_created', 'true');

      console.log('[handleSubmitOrder] Pedido creado exitosamente:', {
        orderId: responseData.order_id,
        orderToken: responseData.order_token ? 'presente' : 'ausente',
        trackingCode: responseData.tracking_code,
        guardadoEnSessionStorage: true
      });

      onClearCart();
    } catch (err) {
      console.error('Error creating order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Hubo un error al procesar tu pedido. Por favor intenta nuevamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadingProof(true);

    try {
      console.log('[handleUploadProof] Validando datos:', {
        orderId: orderId ? 'presente' : 'FALTA',
        orderToken: orderToken ? 'presente' : 'FALTA',
        trackingCode: trackingCode ? 'presente' : 'FALTA',
        proofFile: proofFile ? 'presente' : 'FALTA',
        proofFileName: proofFile?.name
      });

      if (!orderId) {
        console.error('[handleUploadProof] Error: orderId no está disponible');
        setError('Error: No se encontró el ID del pedido. Por favor, intenta crear el pedido nuevamente.');
        setUploadingProof(false);
        return;
      }

      if (!orderToken) {
        console.error('[handleUploadProof] Error: orderToken no está disponible');
        setError('Error: No se encontró el token de la orden. Por favor, intenta crear el pedido nuevamente.');
        setUploadingProof(false);
        return;
      }

      if (!trackingCode) {
        console.error('[handleUploadProof] Error: trackingCode no está disponible');
        setError('Error: No se encontró el código de seguimiento. Por favor, intenta crear el pedido nuevamente.');
        setUploadingProof(false);
        return;
      }

      if (!proofFile) {
        console.error('[handleUploadProof] Error: proofFile no está seleccionado');
        setError('Debes seleccionar una imagen del comprobante');
        setUploadingProof(false);
        return;
      }

      console.log('[handleUploadProof] Leyendo archivo para convertir a base64...');

      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(proofFile);
      });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const uploadProofUrl = `${supabaseUrl}/functions/v1/upload-payment-proof`;

      const payload = {
        order_id: orderId,
        order_token: orderToken,
        file_name: proofFile.name,
        file_data: fileData,
      };

      console.log('[handleUploadProof] Payload a enviar:', {
        order_id: payload.order_id ? 'presente' : 'FALTA',
        order_token: payload.order_token ? 'presente' : 'FALTA',
        file_name: payload.file_name,
        file_data_length: payload.file_data.length,
        file_data_preview: payload.file_data.substring(0, 50) + '...'
      });

      console.log('[handleUploadProof] Enviando request al edge function:', {
        url: uploadProofUrl,
        payload_keys: Object.keys(payload)
      });

      const response = await fetch(uploadProofUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Info': 'supabase-js/2.57.4',
          'Apikey': anonKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[handleUploadProof] Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || 'Error al subir el comprobante');
      }

      const responseData = await response.json();
      console.log('[handleUploadProof] Comprobante subido exitosamente:', responseData);

      setError(null);
      setProofFile(null);
      setProofPreview(null);
      setProofUploaded(true);
      sessionStorage.setItem('checkout_proof_uploaded', 'true');
    } catch (err) {
      console.error('Error uploading proof:', err);
      const errorMessage = err instanceof Error ? err.message : 'Hubo un error al subir el comprobante. Por favor intenta nuevamente.';
      setError(errorMessage);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCopyTracking = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopiedTracking(true);
      setRedirecting(true);

      setTimeout(() => {
        sessionStorage.removeItem('checkout_order_id');
        sessionStorage.removeItem('checkout_order_token');
        sessionStorage.removeItem('checkout_tracking_code');
        sessionStorage.removeItem('checkout_order_created');
        sessionStorage.removeItem('checkout_proof_uploaded');
        navigate('/');
      }, 1800);
    } catch (error) {
      console.error('Error copying tracking code:', error);
      setCopiedTracking(false);
      setRedirecting(false);
    }
  };

  const cleanupCheckout = () => {
    sessionStorage.removeItem('checkout_order_id');
    sessionStorage.removeItem('checkout_order_token');
    sessionStorage.removeItem('checkout_tracking_code');
    sessionStorage.removeItem('checkout_order_created');
    sessionStorage.removeItem('checkout_proof_uploaded');
  };

  const handleCancelOrderAndBack = async () => {
    setCancellingOrder(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const cancelOrderUrl = `${supabaseUrl}/functions/v1/cancel-order`;

      let authHeader = '';
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        authHeader = `Bearer ${session.access_token}`;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Client-Info': 'supabase-js/2.57.4',
        'Apikey': anonKey,
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch(cancelOrderUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: orderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cancelar la orden');
      }

      cleanupCheckout();
      navigate('/');
    } catch (err) {
      console.error('Error cancelling order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Hubo un error al cancelar la orden. Por favor intenta nuevamente.';
      setError(errorMessage);
    } finally {
      setCancellingOrder(false);
    }
  };

  const handleBackToStore = () => {
    cleanupCheckout();
    navigate('/');
  };

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

  if (proofUploaded) {
    if (!trackingCode) {
      return (
        <>
          <Header />
          <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-red-500/30 rounded-xl p-8 text-center shadow-2xl">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
                  <p className="text-red-400 font-semibold mb-2">Error al obtener el código de seguimiento</p>
                  <p className="text-slate-300 text-sm">
                    Hubo un problema al recuperar tu código de seguimiento. Por favor, contacta con soporte.
                  </p>
                </div>

                <button
                  onClick={handleBackToStore}
                  className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg transition-all w-full"
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
                <p className="text-slate-300 text-sm">
                  Guarda este código para rastrear tu pedido
                </p>
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
                  <p className="text-slate-300 text-sm mt-2">
                    Redirigiendo a la tienda...
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleCopyTracking}
                    disabled={copiedTracking}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-lg transition-colors w-full mb-4 disabled:opacity-70"
                  >
                    {copiedTracking ? (
                      <>
                        <Check className="w-5 h-5" />
                        Copiando...
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copiar código de seguimiento
                      </>
                    )}
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

  if (orderCreated) {
    return (
      <>
        <Header onSearch={() => {}} searchQuery="" user={null} />
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 rounded-xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">¡Pedido Creado!</h2>
                <p className="text-slate-300">Ahora necesitamos que subas el comprobante de transferencia</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-blue-400 font-semibold text-sm mb-2">Próximo paso</p>
                <p className="text-slate-300 text-sm">
                  Sube el comprobante de tu transferencia bancaria para completar tu pedido. Una vez lo valides, recibirás tu número de seguimiento.
                </p>
              </div>

              <form onSubmit={handleUploadProof} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">Comprobante de Transferencia</h3>

                  {(!orderId || !trackingCode) && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <p className="text-red-400 font-semibold mb-1">Error de pedido</p>
                      <p className="text-slate-300 text-sm">
                        No se encontró la información del pedido. Por favor, vuelve a la tienda e intenta nuevamente.
                      </p>
                    </div>
                  )}

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
                        id="proof-upload-step2"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="proof-upload-step2" className="cursor-pointer block">
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
                    disabled={uploadingProof || !proofFile || !orderId || !trackingCode || cancellingOrder}
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

  return (
    <>
      <Header onSearch={() => {}} searchQuery="" user={null} />
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
                  {hasPrefilledData && (
                    <p className="text-xs text-slate-400">Datos desde tu perfil</p>
                  )}
                </div>

                {hasPrefilledData && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex justify-between items-center mb-4">
                    <p className="text-slate-300 text-sm">Para modificar tus datos, ve a <span className="text-blue-400 font-semibold">Mi Perfil</span></p>
                    <button
                      type="button"
                      onClick={() => navigate('/perfil')}
                      className="text-blue-400 hover:text-blue-300 text-sm font-semibold underline transition-colors whitespace-nowrap ml-2"
                    >
                      Ir a Mi Perfil
                    </button>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Nombre *</label>
                  <input
                    type="text"
                    required
                    readOnly={hasPrefilledData}
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none ${hasPrefilledData ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">Apellido *</label>
                  <input
                    type="text"
                    required
                    readOnly={hasPrefilledData}
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none ${hasPrefilledData ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                    readOnly={hasPrefilledData}
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none ${hasPrefilledData ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="V-12345678"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">Teléfono *</label>
                  <input
                    type="tel"
                    required
                    readOnly={hasPrefilledData}
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none ${hasPrefilledData ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="0424-1234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Email *</label>
                <input
                  type="email"
                  required
                  readOnly={hasPrefilledData}
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none ${hasPrefilledData ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="juan@ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Estado *</label>
                  <select
                    required
                    disabled={hasPrefilledData}
                    value={formData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none ${hasPrefilledData ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                    disabled={!formData.state || hasPrefilledData}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none ${!formData.state || hasPrefilledData ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                    readOnly={hasPrefilledData}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none resize-none ${hasPrefilledData ? 'opacity-60 cursor-not-allowed' : ''}`}
                    rows={3}
                    placeholder="Calle, edificio, piso, apartamento..."
                  />
                </div>
              </div>

              <BankAccountsCarousel />

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 font-semibold text-sm mb-2">Próximo paso</p>
                <p className="text-slate-300 text-sm">
                  Después de confirmar tu pedido, podrás subir el comprobante de tu transferencia bancaria.
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
                      <div key={item.product.id} className="flex justify-between text-sm pb-3 border-b border-slate-700">
                        <div className="flex-1 pr-2">
                          <p className="text-white font-medium">{item.product.name}</p>
                          <p className="text-slate-400 text-xs mt-1">Cantidad: {item.quantity}</p>
                        </div>
                        <span className="text-amber-400 font-semibold whitespace-nowrap">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-amber-500/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Subtotal</span>
                      <span className="text-white font-semibold">${subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">IVA (19%)</span>
                      <span className="text-white font-semibold">${iva.toFixed(2)}</span>
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

                    <div className="flex justify-between items-center pt-4 border-t border-amber-500/30">
                      <span className="text-white font-bold text-lg">Total a Pagar</span>
                      <span className="text-amber-400 font-bold text-2xl">${total.toFixed(2)}</span>
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
