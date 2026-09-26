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
      throw new Error("Missing Supabase environment variables");
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Verificar que quien pide está autenticado.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "No autorizado" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return json({ error: "No autorizado" }, 401);
    }

    // 2) Verificar que es administrador (función is_admin de la BD).
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", {
      p_uid: user.id,
    });
    if (adminError || !isAdmin) {
      return json({ error: "Acceso restringido: solo administradores" }, 403);
    }

    // 3) Obtener el pedido y su comprobante.
    const { order_id }: GetProofRequest = await req.json();
    if (!order_id) {
      return json({ error: "Falta order_id" }, 400);
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("payment_proof_url")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError) return json({ error: "Error al buscar el pedido" }, 500);
    if (!order || !order.payment_proof_url) {
      return json({ error: "Este pedido no tiene comprobante" }, 404);
    }

    // 4) Extraer la ruta dentro del bucket a partir de la URL guardada.
    //    Formato típico: .../object/public/transfer-proofs/transferencias/RYU-XXXX.jpg
    const marker = "/transfer-proofs/";
    const idx = order.payment_proof_url.indexOf(marker);
    if (idx === -1) {
      return json({ error: "No se pudo determinar la ruta del comprobante" }, 500);
    }
    const filePath = order.payment_proof_url.substring(idx + marker.length);

    // 5) Generar URL firmada temporal (bucket privado).
    const { data: signed, error: signError } = await supabase.storage
      .from("transfer-proofs")
      .createSignedUrl(filePath, SIGNED_URL_TTL);

    if (signError || !signed) {
      return json({ error: "No se pudo generar el enlace del comprobante" }, 500);
    }

    return json({ url: signed.signedUrl, expires_in: SIGNED_URL_TTL });
  } catch (error) {
    return json(
      { error: "Error interno", details: error instanceof Error ? error.message : String(error) },
      500
    );
  }
});
