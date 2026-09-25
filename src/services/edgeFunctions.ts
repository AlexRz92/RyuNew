import { functionsBaseUrl, supabase, supabaseAnonKeyValue } from '../lib/supabase';

interface CallOptions {
  /** Cuerpo JSON de la petición. */
  body?: unknown;
  /** Si es true, adjunta el token de sesión del usuario si existe. */
  withAuth?: boolean;
}

/**
 * Llama a una Edge Function de Supabase con los headers correctos.
 * Centraliza la lógica que antes estaba duplicada en Checkout y TrackOrder.
 *
 * @throws Error con el mensaje devuelto por la función si la respuesta no es OK.
 */
export async function callEdgeFunction<T>(name: string, options: CallOptions = {}): Promise<T> {
  const { body, withAuth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Info': 'supabase-js',
    Apikey: supabaseAnonKeyValue,
    Authorization: `Bearer ${supabaseAnonKeyValue}`,
  };

  if (withAuth) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  const response = await fetch(`${functionsBaseUrl}/${name}`, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Respuesta sin cuerpo JSON.
  }

  if (!response.ok) {
    const message =
      (data as { error?: string } | null)?.error || `Error en la función ${name} (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
