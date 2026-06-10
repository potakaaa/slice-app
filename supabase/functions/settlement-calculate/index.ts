import { withCors } from "../_shared/cors.ts";
import { fail, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { settlementCalculateSchema } from "../_shared/schemas.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    await requireAuth(req);
    const body = settlementCalculateSchema.parse(await readJson(req));
    const settlementAmount = Math.round(body.balance * body.settlement_percentage * 100) / 100;
    return ok({
      balance: body.balance,
      settlement_percentage: body.settlement_percentage,
      settlement_amount: settlementAmount,
      estimated_savings: Math.round((body.balance - settlementAmount) * 100) / 100,
    });
  } catch (error) {
    return fail(error);
  }
}));
