import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INVALID_RESPONSE = new Response(JSON.stringify({ error: "Invalid or expired code" }), {
  status: 400,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return INVALID_RESPONSE;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch active code by email only (not filtering by code, so we can track failures)
    const { data: codeEntry } = await supabase
      .from("email_verification_codes")
      .select("id, code, expires_at, used, failed_attempts")
      .ilike("email", normalizedEmail)
      .eq("used", false)
      .maybeSingle();

    if (!codeEntry || new Date(codeEntry.expires_at) < new Date()) {
      return INVALID_RESPONSE;
    }

    // Lockout: too many failed attempts — invalidate the code
    if (codeEntry.failed_attempts >= 5) {
      await supabase
        .from("email_verification_codes")
        .update({ used: true })
        .eq("id", codeEntry.id);
      return INVALID_RESPONSE;
    }

    // Wrong code — increment failed attempts
    if (codeEntry.code !== code) {
      await supabase
        .from("email_verification_codes")
        .update({ failed_attempts: codeEntry.failed_attempts + 1 })
        .eq("id", codeEntry.id);
      return INVALID_RESPONSE;
    }

    // Correct code — mark as used
    await supabase
      .from("email_verification_codes")
      .update({ used: true })
      .eq("id", codeEntry.id);

    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[verify-signup-otp] Error:", error);
    return INVALID_RESPONSE;
  }
});
