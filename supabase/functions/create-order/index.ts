import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CartItem {
  product_id: string;
  quantity: number;
}

interface CheckoutRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  country: string;
  state: string;
  city: string;
  address?: string;
  cedula: string;
  items: CartItem[];
  payment_proof_url: string;
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

    const body: CheckoutRequest = await req.json();

    if (!body.customer_name || !body.customer_email || !body.country || !body.state || !body.city || !body.cedula) {
      return new Response(
        JSON.stringify({ error: "Missing required customer fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!body.payment_proof_url) {
      return new Response(
        JSON.stringify({ error: "Debes subir el comprobante antes de confirmar" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const productIds = body.items.map((item) => item.product_id);

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, sku, is_active")
      .in("id", productIds);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return new Response(
        JSON.stringify({ error: "Error validating products" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!products || products.length !== productIds.length) {
      return new Response(
        JSON.stringify({ error: "Some products do not exist" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const inactiveProducts = products.filter((p) => !p.is_active);
    if (inactiveProducts.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Some products are not available",
          products: inactiveProducts.map((p) => p.name),
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

    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory")
      .select("product_id, quantity")
      .in("product_id", productIds);

    if (inventoryError) {
      console.error("Error fetching inventory:", inventoryError);
      return new Response(
        JSON.stringify({ error: "Error checking stock" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const inventoryMap = new Map(
      (inventoryData || []).map((inv) => [inv.product_id, inv.quantity])
    );

    const stockErrors = [];
    for (const item of body.items) {
      const available = inventoryMap.get(item.product_id) || 0;
      if (available < item.quantity) {
        const product = products.find((p) => p.id === item.product_id);
        stockErrors.push({
          product: product?.name,
          requested: item.quantity,
          available: available,
        });
      }
    }

    if (stockErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Insufficient stock",
          details: stockErrors,
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

    const productsMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const orderItems = [];

    for (const item of body.items) {
      const product = productsMap.get(item.product_id);
      if (!product) continue;

      const unitPrice = Number(product.price) || 0;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        product_price: unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    const { data: shippingRule, error: shippingError } = await supabase
      .from("shipping_rules")
      .select("*")
      .eq("country", body.country)
      .eq("state", body.state)
      .eq("city", body.city)
      .eq("is_active", true)
      .maybeSingle();

    if (shippingError) {
      console.error("Error fetching shipping rules:", shippingError);
    }

    let shippingCost = 0;
    let shippingMessage = "Envío por confirmar";

    if (shippingRule) {
      if (shippingRule.is_free) {
        shippingCost = 0;
        shippingMessage = "Envío gratis";
      } else {
        shippingCost = shippingRule.base_cost;
        shippingMessage = `Costo de envío: $${shippingCost.toFixed(2)}`;
      }
    }

    const totalAmount = subtotal + shippingCost;

    const authHeader = req.headers.get("Authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        userId = user.id;
      }
    }

    const shippingNotes = `Cédula: ${body.cedula}\nEstado: ${body.state}\nCiudad: ${body.city}${
      body.address ? `\nDirección: ${body.address}` : ""
    }\n${shippingMessage}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone || null,
        payment_method: "transfer",
        payment_proof_url: body.payment_proof_url,
        total_amount: totalAmount,
        status: "pending",
        notes: shippingNotes,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Error creating order" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);

      await supabase.from("orders").delete().eq("id", order.id);

      return new Response(
        JSON.stringify({ error: "Error creating order items" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracking_code: order.tracking_code,
        order_id: order.id,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        total_amount: totalAmount,
        message: "Orden creada exitosamente",
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
