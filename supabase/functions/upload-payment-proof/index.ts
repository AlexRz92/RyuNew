import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UploadProofRequest {
  order_id: string;
  file_name: string;
  file_data: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body: UploadProofRequest = await req.json();

    console.log("[upload-payment-proof] Request recibido:", {
      order_id: body.order_id ? "presente" : "FALTA",
      file_name: body.file_name,
      file_data_length: body.file_data?.length || 0,
    });

    if (!body.order_id || !body.file_data || !body.file_name) {
      console.error("[upload-payment-proof] Validación fallida:", {
        order_id: !body.order_id ? "FALTA" : "ok",
        file_data: !body.file_data ? "FALTA" : "ok",
        file_name: !body.file_name ? "FALTA" : "ok",
      });
      return new Response(
        JSON.stringify({
          error: "Missing order_id, file_data, or file_name",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, tracking_code")
      .eq("id", body.order_id)
      .maybeSingle();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Error fetching order" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!order) {
      console.error("[upload-payment-proof] Order not found:", body.order_id);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const fileExt = body.file_name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `transferencias/${order.tracking_code}.${fileExt}`;

    console.log("[upload-payment-proof] Subiendo archivo a Storage:", {
      fileName,
      fileSize: body.file_data.length,
    });

    const binaryData = Uint8Array.from(atob(body.file_data), (c) =>
      c.charCodeAt(0)
    );

    const { error: uploadError } = await supabase.storage
      .from("transfer-proofs")
      .upload(fileName, binaryData, {
        cacheControl: "3600",
        upsert: true,
        contentType: `image/${fileExt}`,
      });

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return new Response(
        JSON.stringify({ error: "Error uploading file" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: urlData } = supabase.storage
      .from("transfer-proofs")
      .getPublicUrl(fileName);

    const paymentProofUrl = urlData.publicUrl;

    console.log("[upload-payment-proof] Archivo subido, actualizando orden:", {
      orderId: body.order_id,
      proofUrl: paymentProofUrl,
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_proof_url: paymentProofUrl })
      .eq("id", body.order_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return new Response(
        JSON.stringify({ error: "Error updating order" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[upload-payment-proof] Comprobante actualizado exitosamente");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Comprobante de pago actualizado exitosamente",
        payment_proof_url: paymentProofUrl,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
