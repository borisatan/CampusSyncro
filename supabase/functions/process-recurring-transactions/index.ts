import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const r2 = (n: number) => Math.round(n * 100) / 100;

function advanceDate(dateStr: string, intervalType: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);

  if (intervalType === "biweekly") {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + 14);
    return d.toISOString().split("T")[0];
  }

  // monthly — clamp to last day of target month
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const lastDay = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDay);
  const mm = String(nextMonth).padStart(2, "0");
  const dd = String(clampedDay).padStart(2, "0");
  return `${nextYear}-${mm}-${dd}`;
}

async function sendExpoPush(pushToken: string, title: string, body: string) {
  if (!pushToken.startsWith("ExponentPushToken[")) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: pushToken, title, body, sound: "default" }),
  });
}

async function processRecurring() {
  const today = new Date().toISOString().split("T")[0];

  const { data: dueItems, error } = await supabase
    .from("RecurringTransactions")
    .select(`*, Profiles!inner(push_token)`)
    .eq("is_active", true)
    .lte("next_run_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`);

  if (error) throw new Error(`Query failed: ${error.message}`);

  const results = { processed: 0, failed: 0 };

  for (const item of dueItems ?? []) {
    try {
      // Insert the transaction
      const { error: txError } = await supabase.from("Transactions").insert([{
        user_id: item.user_id,
        amount: r2(item.amount),
        category_name: item.category_name,
        account_name: item.account_name,
        description: item.description,
        created_at: new Date().toISOString(),
      }]);
      if (txError) throw txError;

      // Update account balance
      const { data: acct, error: acctError } = await supabase
        .from("Accounts")
        .select("balance")
        .eq("account_name", item.account_name)
        .eq("user_id", item.user_id)
        .single();
      if (acctError) throw acctError;

      const newBalance = r2(acct.balance + item.amount);
      const { error: balError } = await supabase
        .from("Accounts")
        .update({ balance: newBalance })
        .eq("account_name", item.account_name)
        .eq("user_id", item.user_id);
      if (balError) throw balError;

      // Advance next_run_date and deactivate if past end_date
      const newNextRun = advanceDate(item.next_run_date, item.interval_type);
      const shouldDeactivate = item.end_date !== null && newNextRun > item.end_date;
      const { error: updateError } = await supabase
        .from("RecurringTransactions")
        .update({ next_run_date: newNextRun, is_active: !shouldDeactivate })
        .eq("id", item.id);
      if (updateError) throw updateError;

      // Push notification
      const pushToken = item.Profiles?.push_token;
      if (pushToken) {
        const label = item.description || item.category_name;
        const absAmount = Math.abs(item.amount).toFixed(2);
        const type = item.amount < 0 ? "expense" : "income";
        await sendExpoPush(
          pushToken,
          "Recurring Transaction Applied",
          `${label} — ${absAmount} ${type} has been recorded automatically.`
        );
      }

      results.processed++;
    } catch (err) {
      console.error(`[RecurringProcessor] Failed for item ${item.id}:`, err);
      results.failed++;
    }
  }

  return results;
}

async function notifyUpcoming() {
  const twoDaysOut = new Date();
  twoDaysOut.setUTCDate(twoDaysOut.getUTCDate() + 2);
  const target = twoDaysOut.toISOString().split("T")[0];

  const { data: upcoming, error } = await supabase
    .from("RecurringTransactions")
    .select(`*, Profiles!inner(push_token)`)
    .eq("is_active", true)
    .eq("next_run_date", target);

  if (error) throw new Error(`Notify query failed: ${error.message}`);

  for (const item of upcoming ?? []) {
    const pushToken = item.Profiles?.push_token;
    if (!pushToken) continue;
    const label = item.description || item.category_name;
    const absAmount = Math.abs(item.amount).toFixed(2);
    const dateLabel = new Date(target + "T00:00:00Z").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    await sendExpoPush(
      pushToken,
      "Upcoming Recurring Transaction",
      `${label} (${absAmount}) is scheduled for ${dateLabel}.`
    );
  }

  return { notified: upcoming?.length ?? 0 };
}

Deno.serve(async (req) => {
  // Validate cron secret to prevent unauthorized invocations
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "process";

    if (mode === "notify_upcoming") {
      const result = await notifyUpcoming();
      return new Response(JSON.stringify({ ok: true, mode, ...result }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await processRecurring();
    return new Response(JSON.stringify({ ok: true, mode, ...result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[process-recurring-transactions] Fatal error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
