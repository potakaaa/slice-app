import { withCors } from "../_shared/cors.ts";
import { fail, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { savingsCalculateSchema } from "../_shared/schemas.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    await requireAuth(req);
    const body = savingsCalculateSchema.parse(await readJson(req));
    const estimatedMonths = body.monthly_savings <= 0 ? 0 : Math.ceil(body.settlement_amount / body.monthly_savings);
    const target = new Date();
    target.setMonth(target.getMonth() + estimatedMonths);
    return ok({
      settlement_amount: body.settlement_amount,
      monthly_savings: body.monthly_savings,
      estimated_months: estimatedMonths,
      target_date: estimatedMonths > 0 ? target.toISOString().slice(0, 10) : null,
    });
  } catch (error) {
    return fail(error);
  }
}));
