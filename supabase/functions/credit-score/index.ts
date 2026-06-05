import { withCors } from "../_shared/cors.ts";
import { fail, HttpError, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { creditScoreInputSchema } from "../_shared/schemas.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    if (req.method === "GET") {
      const { data, error } = await ctx.userClient
        .from("credit_score_history")
        .select("*")
        .order("recorded_on", { ascending: false });
      if (error) throw error;
      return ok(data);
    }
    if (req.method === "POST") {
      const body = creditScoreInputSchema.parse(await readJson(req));
      const { data, error } = await ctx.userClient
        .from("credit_score_history")
        .insert({ ...body, user_id: ctx.user.id })
        .select()
        .single();
      if (error) throw error;
      await ctx.userClient.from("profiles").update({ credit_score: body.score }).eq("id", ctx.user.id);
      return ok(data, { status: 201 });
    }
    throw new HttpError(405, "method_not_allowed", "Method not allowed");
  } catch (error) {
    return fail(error);
  }
}));
