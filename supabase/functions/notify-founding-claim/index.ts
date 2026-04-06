import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller's JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, userId } = await req.json();

    // Ensure the userId in the payload matches the authenticated user
    if (!email || !userId || userId !== user.id) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Idempotency: skip if already a founding member
    const { data: existing } = await serviceClient
      .from("founding_members")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    // 1. Grant founding member status (service_role bypasses RLS)
    await serviceClient
      .from("founding_members")
      .insert({ user_id: userId });

    // 2. Mark the waitlist entry as claimed
    await serviceClient
      .from("waitlist_signups")
      .update({ claimed_at: now, user_id: userId })
      .ilike("email", normalizedEmail);

    // 3. Send notification email to support
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? Deno.env.get("RESEND_EMAIL_FROM") ?? "noreply@monelo.app";
    const supportEmail = Deno.env.get("SUPPORT_EMAIL_TO")!;

    const claimedAt = new Date().toLocaleString("en-GB", { timeZone: "UTC" });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: supportEmail,
        subject: "🎉 Founding Member Claimed — Action Needed",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #0f0f1a;">Founding Member Claimed!</h2>
            <p style="color: #555;">A founding member has verified their email and signed up for Monelo. They already have access. Grant them lifetime access in RevenueCat when you get a chance.</p>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
              <tr style="background: #f9f9fb;">
                <td style="padding: 12px 16px; font-weight: 600; color: #444; width: 120px;">Email</td>
                <td style="padding: 12px 16px; color: #0f0f1a;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #444;">User ID</td>
                <td style="padding: 12px 16px; font-family: monospace; font-size: 13px; color: #0f0f1a;">${userId}</td>
              </tr>
              <tr style="background: #f9f9fb;">
                <td style="padding: 12px 16px; font-weight: 600; color: #444;">Claimed at</td>
                <td style="padding: 12px 16px; color: #0f0f1a;">${claimedAt} UTC</td>
              </tr>
            </table>
            <div style="background: #eef2ff; border-left: 4px solid #4F6EF7; padding: 14px 16px; border-radius: 4px; margin-top: 8px;">
              <strong style="color: #3730a3;">Action:</strong>
              <span style="color: #374151;"> RevenueCat → Customers → search <code style="background:#dde3ff;padding:2px 5px;border-radius:3px;">${userId}</code> → Grant Promotional Entitlement → <strong>premium</strong> → Lifetime</span>
            </div>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[notify-founding-claim] Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
