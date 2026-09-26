import { supabase } from '../lib/supabase';
import type { CartItem, OrderStatus } from '../lib/types';
import { callEdgeFunction } from './edgeFunctions';

export interface CreateOrderInput {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  country: string;
  state: string;
  city: string;
  address?: string;
  cedula?: string;
  rif?: string;
  items: CartItem[];
}

export interface CreateOrderResult {
  success: boolean;
  tracking_code: string;
  order_id: string;
  order_token: string;
  subtotal: number;
  iva: number;
  shipping_cost: number;
  total_amount: number;
}

/** Crea un pedido a través de la Edge Function `create-order`. */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const payload = {
    customer_name: input.customer_name,
    customer_email: input.customer_email,
    customer_phone: input.customer_phone || undefined,
    country: input.country,
    state: input.state,
    city: input.city,
    address: input.address || undefined,
    cedula: input.cedula || undefined,
    rif: input.rif || undefined,
    items: input.items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    })),
  };

  return callEdgeFunction<CreateOrderResult>('create-order', { body: payload, withAuth: true });
}

export interface UploadProofInput {
  order_id: string;
  order_token: string;
  file: File;
}

/** Sube el comprobante de pago (convertido a base64) via `upload-payment-proof`. */
export async function uploadPaymentProof(input: UploadProofInput): Promise<{ payment_proof_url: string }> {
  const fileData = await fileToBase64(input.file);

  return callEdgeFunction<{ payment_proof_url: string }>('upload-payment-proof', {
    body: {
      order_id: input.order_id,
      order_token: input.order_token,
      file_name: input.file.name,
      file_data: fileData,
    },
  });
}

/** Cancela un pedido (restaura stock) via `cancel-order`. */
export async function cancelOrder(orderId: string): Promise<void> {
  await callEdgeFunction('cancel-order', { body: { order_id: orderId }, withAuth: true });
}

export interface TrackedOrder {
  tracking_code: string;
  status: OrderStatus;
  created_at: string;
  total_amount: number;
  shipping_cost?: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

/** Consulta el estado de un pedido por su código via `track-order`. */
export async function trackOrder(trackingCode: string): Promise<TrackedOrder> {
  return callEdgeFunction<TrackedOrder>('track-order', {
    body: { tracking_code: trackingCode.trim() },
  });
}

/** Calcula el costo de envío para un destino según `shipping_rules`. */
export interface ShippingInfo {
  isFree: boolean;
  cost: number;
  message: string;
}

export async function calculateShipping(
  country: string,
  state: string,
  city: string,
  currencySymbol: string
): Promise<ShippingInfo> {
  const { data: rule } = await supabase
    .from('shipping_rules')
    .select('*')
    .eq('country', country)
    .eq('state', state)
    .eq('city', city)
    .eq('is_active', true)
    .maybeSingle();

  if (!rule) {
    return { isFree: false, cost: 0, message: 'Envío por confirmar' };
  }

  if (rule.is_free) {
    return { isFree: true, cost: 0, message: 'Envío gratis' };
  }

  return {
    isFree: false,
    cost: rule.base_cost,
    message: `${currencySymbol}${rule.base_cost.toFixed(2)} (puede variar según la distancia)`,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}
