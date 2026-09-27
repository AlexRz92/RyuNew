import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ResetMfaRequest {
  target_user_id: string;
}

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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Config incompleta" }, 500);
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const admin = createClient(supabaseUrl, serviceKey);

    // 1) Autenticación del solicitante
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : "";
    if (!token) return json({ error: "No autorizado" }, 401);

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: "No autorizado" }, 401);

    // 2) Verificar que es admin
    let isAdmin = false;
    const rpc = await admin.rpc("is_admin", { p_uid: userData.user.id });
    if (!rpc.error && rpc.data === true) {
      isAdmin = true;
    } else {
      const { data: row } = await admin
        .from("admin_users")
        .select("is_active")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      isAdmin = Boolean(row?.is_active);
    }
    if (!isAdmin) return json({ error: "Acceso restringido: solo administradores" }, 403);

    // 3) Obtener el usuario objetivo y borrar sus factores MFA
    const { target_user_id }: ResetMfaRequest = await req.json();
    if (!target_user_id) return json({ error: "Falta target_user_id" }, 400);

    const { data: factorsData, error: listError } =
      await admin.auth.admin.mfa.listFactors({ userId: target_user_id });
    if (listError) return json({ error: "No se pudieron listar los factores", details: listError.message }, 500);

    const factors = factorsData?.factors ?? [];
    for (const factor of factors) {
      await admin.auth.admin.mfa.deleteFactor({ userId: target_user_id, id: factor.id });
    }

    return json({ success: true, removed: factors.length });
  } catch (error) {
    return json(
      { error: "Error interno", details: error instanceof Error ? error.message : String(error) },
      500
    );
  }
});
