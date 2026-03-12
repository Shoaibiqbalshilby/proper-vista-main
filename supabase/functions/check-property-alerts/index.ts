import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { property } = await req.json();

    if (!property || !property.id) {
      throw new Error("Missing property data");
    }

    // Fetch all active alerts
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from("property_alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ matched: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Match property against each alert
    const matchedAlerts = alerts.filter((alert) => {
      // Don't notify the property owner about their own listing
      if (alert.user_id === property.user_id) return false;

      if (alert.location && !property.location.toLowerCase().includes(alert.location.toLowerCase())) return false;
      if (alert.listing_type && alert.listing_type !== "all" && property.listing_type !== alert.listing_type) return false;
      if (alert.property_type && alert.property_type !== "all" && property.property_type !== alert.property_type) return false;
      if (alert.min_bedrooms && property.bedrooms < alert.min_bedrooms) return false;
      if (alert.min_bathrooms && property.bathrooms < alert.min_bathrooms) return false;
      if (alert.min_price && property.price < alert.min_price) return false;
      if (alert.max_price && property.price > alert.max_price) return false;
      return true;
    });

    if (matchedAlerts.length === 0) {
      return new Response(
        JSON.stringify({ matched: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create notifications for matched alerts
    const notifications = matchedAlerts.map((alert) => ({
      alert_id: alert.id,
      user_id: alert.user_id,
      property_id: property.id,
      property_title: property.title,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("alert_notifications")
      .insert(notifications);

    if (insertError) throw insertError;

    // Log email notification intent for each matched user
    const userIds = [...new Set(matchedAlerts.map((a) => a.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    for (const profile of profiles || []) {
      console.log(`📧 Property alert email:
        To: user ${profile.user_id} (${profile.full_name})
        Property: "${property.title}" in ${property.location}
        Price: ${property.price_label}`);
    }

    return new Response(
      JSON.stringify({ matched: matchedAlerts.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error checking property alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
