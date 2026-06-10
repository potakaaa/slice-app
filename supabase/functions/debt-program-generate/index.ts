import { withCors } from "../_shared/cors.ts";
import { fail, ok } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { env } from "../_shared/env.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const { data: creditors, error } = await ctx.userClient
      .from("creditors")
      .select("*")
      .order("balance", { ascending: true });
    if (error) throw error;

    const rows = creditors ?? [];
    const totalDebt = rows.reduce((sum, item) => sum + Number(item.balance), 0);
    const targetSettlement = rows.reduce((sum, item) => sum + Number(item.balance) * Number(item.settlement_percentage), 0);
    const monthlySavings = rows.reduce((sum, item) => sum + Number(item.monthly_savings), 0);
    const estimatedMonths = monthlySavings <= 0 ? 0 : Math.ceil(targetSettlement / monthlySavings);

    const { data, error: insertError } = await ctx.userClient.from("debt_programs").insert({
      user_id: ctx.user.id,
      name: "SLICE Debt Resolution Program",
      total_debt: totalDebt,
      target_settlement_amount: targetSettlement,
      monthly_savings: monthlySavings,
      estimated_months: estimatedMonths,
      disclaimer_version: env("LEGAL_TERMS_VERSION", "2026-06-05"),
    }).select().single();
    if (insertError) throw insertError;
    return ok({ program: data, creditors: rows });
  } catch (error) {
    return fail(error);
  }
}));
