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
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Rate limit: max 5 sends per email per 10 minutes
    // NOTE: we do NOT delete old rows before counting — deletion would reset the counter.
    // Instead we invalidate the previous code below (used = true) so it stays countable.
    const { count } = await supabase
      .from("email_verification_codes")
      .select("*", { count: "exact", head: true })
      .ilike("email", normalizedEmail)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ rateLimited: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invalidate any existing unused codes for this email (keep rows for rate-limit counting)
    await supabase
      .from("email_verification_codes")
      .update({ used: true })
      .ilike("email", normalizedEmail)
      .eq("used", false);

    // Generate 6-digit code with 10-minute expiry
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = (100000 + (array[0] % 900000)).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("email_verification_codes").insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
    });

    // Send OTP via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const fromEmail = Deno.env.get("SUPPORT_EMAIL_FROM") ?? Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@monelo.app";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: normalizedEmail,
        subject: "Verify your Monelo account",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff;">
            <h2 style="color: #0f0f1a; font-size: 22px; margin-bottom: 8px;">Verify your email</h2>
            <p style="color: #555; font-size: 15px;">Enter this code in the Monelo app to confirm your email address and create your account:</p>
            <div style="background: #f5f5f9; border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0;">
              <span style="font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #4F6EF7;">${code}</span>
            </div>
            <p style="color: #999; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-signup-otp] Error:", error);
    // Always return success to avoid leaking information
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
