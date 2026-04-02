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

    // Always return success to avoid leaking which emails are in the list
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if email is in waitlist_signups and hasn't claimed yet
    const { data: waitlistEntry } = await supabase
      .from("waitlist_signups")
      .select("email, claimed_at")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (!waitlistEntry || waitlistEntry.claimed_at) {
      // Not eligible or already claimed — return silently
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete any existing unused codes for this email
    await supabase
      .from("founding_verification_codes")
      .delete()
      .ilike("email", normalizedEmail)
      .eq("used", false);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("founding_verification_codes").insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
    });

    // Send OTP via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const fromEmail = Deno.env.get("SUPPORT_EMAIL_FROM") ?? Deno.env.get("RESEND_EMAIL_FROM") ?? "noreply@monelo.app";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: normalizedEmail,
        subject: "Your Founding Member verification code",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff;">
            <h2 style="color: #0f0f1a; font-size: 22px; margin-bottom: 8px;">Your verification code</h2>
            <p style="color: #555; font-size: 15px;">Enter this code to claim your free lifetime access to Monelo as a founding member:</p>
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
    console.error("[send-founding-otp] Error:", error);
    // Always return success to avoid leaking information
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
