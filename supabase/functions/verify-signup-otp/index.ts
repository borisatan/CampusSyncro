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
    const { email, code, password, foundingMemberEmail } = await req.json();

    if (!email || !code) {
      return INVALID_RESPONSE;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch active code by email only (not filtering by code, so we can track failures)
    // Use limit(1) + order to avoid maybeSingle() silently returning null on multiple rows
    const { data: rows, error: fetchError } = await supabase
      .from("email_verification_codes")
      .select("id, code, expires_at, used, failed_attempts")
      .ilike("email", normalizedEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("[verify-signup-otp] DB fetch error:", fetchError);
      return INVALID_RESPONSE;
    }

    const codeEntry = rows?.[0] ?? null;

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

    // Wrong code — increment failed attempts (String() guards against integer column type)
    if (String(codeEntry.code) !== String(code)) {
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

    // If a password is provided, create the user via admin API so the email is
    // auto-confirmed. This avoids Supabase's own confirmation email flow since
    // we already verified the email with our custom OTP above.
    if (password) {
      const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });
      if (createError && !createError.message.includes("already registered")) {
        console.error("[verify-signup-otp] Admin createUser error:", createError);
        return new Response(JSON.stringify({ error: "Failed to create account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If this user is a founding member, insert the record immediately so the
      // founding_members check in SubscriptionContext always finds it on first sign-in.
      // We do this here (before the client calls signInWithPassword) to avoid the race
      // condition where initForUser queries founding_members before notify-founding-claim
      // has had a chance to insert it.
      const normalizedFoundingEmail = foundingMemberEmail?.trim().toLowerCase();
      if (normalizedFoundingEmail && normalizedFoundingEmail === normalizedEmail && createdUser?.user?.id) {
        const { error: insertError } = await supabase
          .from("founding_members")
          .upsert({ user_id: createdUser.user.id }, { onConflict: "user_id", ignoreDuplicates: true });
        if (insertError) {
          console.error("[verify-signup-otp] founding_members upsert error:", insertError);
        }
      }
    }

    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[verify-signup-otp] Error:", error);
    return INVALID_RESPONSE;
  }
});
