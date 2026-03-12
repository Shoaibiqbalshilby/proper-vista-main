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
    const { recipientEmail, senderName, propertyTitle, message } = await req.json();

    if (!recipientEmail || !senderName || !propertyTitle) {
      throw new Error("Missing required fields");
    }

    // Use Lovable AI gateway to format and log the notification
    // For actual email delivery, a third-party email service (e.g. Resend) would be needed
    // For now, we log the notification intent
    console.log(`📧 Email notification:
      To: ${recipientEmail}
      Subject: New message about "${propertyTitle}"
      From: ${senderName}
      Message: ${message?.substring(0, 100)}...`);

    // In production, integrate Resend or similar service here:
    // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    // await resend.emails.send({ from: "...", to: [recipientEmail], subject: "...", html: "..." });

    return new Response(
      JSON.stringify({ success: true, message: "Notification logged" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in notify-message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
