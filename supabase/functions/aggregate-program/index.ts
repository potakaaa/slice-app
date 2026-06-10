import { withCors } from "../_shared/cors.ts";
import { fail, HttpError, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import {
  aggregateProgramSyncSchema,
  savingsTrackerMonthPatchSchema,
} from "../_shared/schemas.ts";

type DebtProgramRow = {
  id: string;
  user_id: string;
  name: string;
  total_debt: number | string;
  target_settlement_amount: number | string;
  monthly_savings: number | string;
  estimated_months: number;
  settlement_rate: number | string;
  savings_disclosure_accepted_at: string | null;
};

type SavingsTrackerRow = {
  id: string;
  program_id: string | null;
  month_index: number | null;
  monthly_amount: number | string;
  status: string;
  saved_at: string | null;
};

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildResponse(
  program: DebtProgramRow | null,
  months: SavingsTrackerRow[],
) {
  if (!program) {
    return { program: null, months: [] };
  }

  return {
    program: {
      id: program.id,
      totalDebt: toNumber(program.total_debt),
      estimatedSettlementAmount: toNumber(program.target_settlement_amount),
      monthlySavingsAmount: toNumber(program.monthly_savings),
      programLengthMonths: program.estimated_months,
      settlementRate: toNumber(program.settlement_rate, 0.5),
      disclosureAccepted: Boolean(program.savings_disclosure_accepted_at),
      disclosureAcceptedAt: program.savings_disclosure_accepted_at,
    },
    months: months
      .filter((month) => month.month_index != null)
      .sort((a, b) => (a.month_index ?? 0) - (b.month_index ?? 0))
      .map((month) => ({
        id: month.id,
        programId: month.program_id ?? program.id,
        monthIndex: month.month_index ?? 0,
        monthlyAmount: toNumber(month.monthly_amount),
        status: month.status === "saved" ? "saved" : "pending",
        savedAt: month.saved_at,
      })),
  };
}

async function fetchProgramAndMonths(ctx: Awaited<ReturnType<typeof requireAuth>>) {
  const { data: program, error: programError } = await ctx.userClient
    .from("debt_programs")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (programError) throw programError;

  if (!program) {
    return { program: null, months: [] as SavingsTrackerRow[] };
  }

  const { data: months, error: monthsError } = await ctx.userClient
    .from("monthly_savings_plans")
    .select("id,program_id,month_index,monthly_amount,status,saved_at")
    .eq("program_id", program.id)
    .order("month_index", { ascending: true });
  if (monthsError) throw monthsError;

  return {
    program: program as DebtProgramRow,
    months: (months ?? []) as SavingsTrackerRow[],
  };
}

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);

    if (req.method === "GET") {
      const { program, months } = await fetchProgramAndMonths(ctx);
      return ok(buildResponse(program, months));
    }

    if (req.method === "POST") {
      const body = aggregateProgramSyncSchema.parse(await readJson(req));

      const [{ data: creditors, error: creditorsError }, { data: profile, error: profileError }] =
        await Promise.all([
          ctx.userClient
            .from("creditors")
            .select("balance")
            .order("priority", { ascending: true }),
          ctx.userClient
            .from("profiles")
            .select("default_monthly_savings")
            .eq("id", ctx.user.id)
            .single(),
        ]);
      if (creditorsError) throw creditorsError;
      if (profileError) throw profileError;

      const totalDebt = (creditors ?? []).reduce(
        (sum, item) => sum + toNumber(item.balance),
        0,
      );
      const settlementRate = 0.5;
      const estimatedSettlementAmount = totalDebt * settlementRate;
      const monthlySavingsAmount = toNumber(profile.default_monthly_savings);
      const programLengthMonths = monthlySavingsAmount > 0
        ? Math.ceil(estimatedSettlementAmount / monthlySavingsAmount)
        : 0;

      const { program: existingProgram, months: existingMonths } = await fetchProgramAndMonths(ctx);
      const disclosureAcceptedAt = body.accept_disclosure
        ? existingProgram?.savings_disclosure_accepted_at ?? new Date().toISOString()
        : existingProgram?.savings_disclosure_accepted_at ?? null;

      const payload = {
        user_id: ctx.user.id,
        name: "Customized Debt Program",
        total_debt: totalDebt,
        target_settlement_amount: estimatedSettlementAmount,
        monthly_savings: monthlySavingsAmount,
        estimated_months: programLengthMonths,
        settlement_rate: settlementRate,
        savings_disclosure_accepted_at: disclosureAcceptedAt,
      };

      const programQuery = existingProgram
        ? ctx.userClient
          .from("debt_programs")
          .update(payload)
          .eq("id", existingProgram.id)
        : ctx.userClient.from("debt_programs").insert(payload);

      const { data: savedProgram, error: saveProgramError } = await programQuery.select("*").single();
      if (saveProgramError) throw saveProgramError;

      const currentProgram = savedProgram as DebtProgramRow;
      const existingByMonth = new Map(
        existingMonths.map((month) => [month.month_index ?? 0, month]),
      );

      if (programLengthMonths === 0) {
        const { error: deleteMonthsError } = await ctx.userClient
          .from("monthly_savings_plans")
          .delete()
          .eq("program_id", currentProgram.id);
        if (deleteMonthsError) throw deleteMonthsError;
      } else {
        const staleIds = existingMonths
          .filter((month) => (month.month_index ?? 0) > programLengthMonths)
          .map((month) => month.id);

        if (staleIds.length > 0) {
          const { error: deleteStaleError } = await ctx.userClient
            .from("monthly_savings_plans")
            .delete()
            .in("id", staleIds);
          if (deleteStaleError) throw deleteStaleError;
        }

        for (let monthIndex = 1; monthIndex <= programLengthMonths; monthIndex += 1) {
          const existing = existingByMonth.get(monthIndex);
          if (existing) {
            const { error: updateMonthError } = await ctx.userClient
              .from("monthly_savings_plans")
              .update({
                program_id: currentProgram.id,
                creditor_id: null,
                month_index: monthIndex,
                monthly_amount: monthlySavingsAmount,
              })
              .eq("id", existing.id);
            if (updateMonthError) throw updateMonthError;
            continue;
          }

          const { error: insertMonthError } = await ctx.userClient
            .from("monthly_savings_plans")
            .insert({
              user_id: ctx.user.id,
              program_id: currentProgram.id,
              creditor_id: null,
              month_index: monthIndex,
              monthly_amount: monthlySavingsAmount,
              status: "pending",
            });
          if (insertMonthError) throw insertMonthError;
        }
      }

      const { program, months } = await fetchProgramAndMonths(ctx);
      return ok(buildResponse(program, months));
    }

    if (req.method === "PATCH") {
      const body = savingsTrackerMonthPatchSchema.parse(await readJson(req));
      const nextStatus = body.saved ? "saved" : "pending";
      const nextSavedAt = body.saved ? new Date().toISOString() : null;

      const { data, error } = await ctx.userClient
        .from("monthly_savings_plans")
        .update({ status: nextStatus, saved_at: nextSavedAt })
        .eq("id", body.month_id)
        .select("id,program_id,month_index,monthly_amount,status,saved_at")
        .single();
      if (error) throw error;

      const { program, months } = await fetchProgramAndMonths(ctx);
      if (!program) throw new HttpError(404, "program_not_found", "Debt program not found");

      const updatedMonths = months.map((month) => month.id === data.id ? data as SavingsTrackerRow : month);
      return ok(buildResponse(program, updatedMonths));
    }

    throw new HttpError(405, "method_not_allowed", "Method not allowed");
  } catch (error) {
    return fail(error);
  }
}));
