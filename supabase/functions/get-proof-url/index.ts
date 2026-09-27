import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GetProofRequest {
  order_id: string;
}

/** Segundos que dura válida la URL firmada del comprobante. */
const SIGNED_URL_TTL = 300; // 5 minutos
const BUCKET = "transfer-proofs";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return json({ error: "Config del servidor incompleta" }, 500);
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Autenticación
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : "";
    if (!token) return json({ error: "No autorizado (sin token)" }, 401);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return json({ error: "No autorizado (token inválido)" }, 401);
    }
    const userId = userData.user.id;

    // 2) Verificar admin. Si la RPC falla por cualquier motivo, hacemos
    //    fallback a consultar admin_users directamente.
    let isAdmin = false;
    const rpc = await supabase.rpc("is_admin", { p_uid: userId });
    if (!rpc.error && rpc.data === true) {
      isAdmin = true;
    } else {
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("is_active")
        .eq("user_id", userId)
        .maybeSingle();
      isAdmin = Boolean(adminRow?.is_active);
    }
    if (!isAdmin) {
      return json({ error: "Acceso restringido: solo administradores" }, 403);
    }

    // 3) Leer el pedido
    let body: GetProofRequest;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Cuerpo inválido" }, 400);
    }
    if (!body.order_id) return json({ error: "Falta order_id" }, 400);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("payment_proof_url")
      .eq("id", body.order_id)
      .maybeSingle();

    if (orderError) {
      return json({ error: "Error al buscar el pedido", details: orderError.message }, 500);
    }
    if (!order || !order.payment_proof_url) {
      return json({ error: "Este pedido no tiene comprobante" }, 404);
    }

    // 4) Determinar la ruta dentro del bucket.
    //    Puede venir como URL completa (.../<BUCKET>/ruta) o ya como ruta.
    const raw: string = order.payment_proof_url;
    let filePath = raw;
    const marker = `/${BUCKET}/`;
    const idx = raw.indexOf(marker);
    if (idx !== -1) {
      filePath = raw.substring(idx + marker.length);
    }
    // Quita posibles query params.
    filePath = filePath.split("?")[0];

    if (!filePath) {
      return json({ error: "No se pudo determinar la ruta del comprobante", raw }, 500);
    }

    // 5) URL firmada temporal
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_TTL);

    if (signError || !signed) {
      return json(
        { error: "No se pudo generar el enlace", details: signError?.message, filePath },
        500
      );
    }

    return json({ url: signed.signedUrl, expires_in: SIGNED_URL_TTL });
  } catch (error) {
    return json(
      { error: "Error interno", details: error instanceof Error ? error.message : String(error) },
      500
    );
  }
});
