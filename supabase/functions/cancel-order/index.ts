import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CancelRequest {
  order_id: string;
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

    const body: CancelRequest = await req.json();

    if (!body.order_id) {
      return new Response(
        JSON.stringify({ error: "Missing order_id" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        userId = user.id;
      }
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
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

    if (order.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Order cannot be cancelled - it is not in pending status" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (userId && order.user_id && userId !== order.user_id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - order does not belong to this user" }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", body.order_id);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      return new Response(
        JSON.stringify({ error: "Error fetching order items" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    for (const item of orderItems || []) {
      const { data: inventory, error: invError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("product_id", item.product_id)
        .maybeSingle();

      if (invError) {
        console.error("Error fetching inventory:", invError);
        continue;
      }

      const currentQuantity = inventory?.quantity || 0;
      const newQuantity = currentQuantity + item.quantity;

      const { error: updateError } = await supabase
        .from("inventory")
        .update({ quantity: newQuantity })
        .eq("product_id", item.product_id);

      if (updateError) {
        console.error("Error updating inventory:", updateError);
      }
    }

    const { error: deleteItemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", body.order_id);

    if (deleteItemsError) {
      console.error("Error deleting order items:", deleteItemsError);
      return new Response(
        JSON.stringify({ error: "Error deleting order items" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { error: deleteOrderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", body.order_id);

    if (deleteOrderError) {
      console.error("Error deleting order:", deleteOrderError);
      return new Response(
        JSON.stringify({ error: "Error deleting order" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (order.payment_proof_url) {
      try {
        const storageUrl = order.payment_proof_url;
        const filePath = storageUrl.split("/").slice(-2).join("/");

        const { error: deleteFileError } = await supabase.storage
          .from("transfer-proofs")
          .remove([filePath]);

        if (deleteFileError) {
          console.error("Error deleting payment proof file:", deleteFileError);
        }
      } catch (error) {
        console.error("Error parsing payment proof URL:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order cancelled successfully and stock restored",
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
