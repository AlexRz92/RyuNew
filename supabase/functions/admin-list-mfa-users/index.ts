import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MfaUser {
  user_id: string;
  name: string;
  email: string;
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

    // 2) Verificar admin
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

    // 3) Recorrer usuarios (paginado) y quedarnos con los que tienen MFA verificado
    const mfaUsers: MfaUser[] = [];
    const perPage = 1000;
    let page = 1;
    // Límite de seguridad para no recorrer infinitamente.
    const MAX_PAGES = 20;

    while (page <= MAX_PAGES) {
      const { data: list, error: listError } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listError) {
        return json({ error: "No se pudieron listar usuarios", details: listError.message }, 500);
      }

      const users = list?.users ?? [];
      if (users.length === 0) break;

      for (const u of users) {
        // factors viene incluido en el objeto de usuario admin.
        const factors = (u as { factors?: Array<{ status?: string }> }).factors ?? [];
        const hasVerified = factors.some((f) => f.status === "verified");
        if (hasVerified) {
          mfaUsers.push({ user_id: u.id, name: "", email: u.email ?? "" });
        }
      }

      if (users.length < perPage) break;
      page++;
    }

    // 4) Traer nombres desde customer_profiles
    if (mfaUsers.length > 0) {
      const ids = mfaUsers.map((m) => m.user_id);
      const { data: profiles } = await admin
        .from("customer_profiles")
        .select("id, first_name, last_name")
        .in("id", ids);

      const nameById = new Map(
        (profiles ?? []).map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()])
      );
      for (const m of mfaUsers) {
        m.name = nameById.get(m.user_id) || "(sin nombre)";
      }
    }

    // Orden alfabético por nombre
    mfaUsers.sort((a, b) => a.name.localeCompare(b.name, "es"));

    return json({ users: mfaUsers });
  } catch (error) {
    return json(
      { error: "Error interno", details: error instanceof Error ? error.message : String(error) },
      500
    );
  }
});
