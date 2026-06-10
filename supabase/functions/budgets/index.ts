import { withCors } from "../_shared/cors.ts";
import { fail, HttpError, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { budgetInputSchema, uuidSchema } from "../_shared/schemas.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (req.method === "GET") {
      const { data, error } = await ctx.userClient.from("budgets").select("*").order("month", { ascending: false });
      if (error) throw error;
      return ok(data);
    }
    if (req.method === "POST") {
      const body = budgetInputSchema.parse(await readJson(req));
      const { data, error } = await ctx.userClient
        .from("budgets")
        .upsert({ ...body, user_id: ctx.user.id }, { onConflict: "user_id,month" })
        .select()
        .single();
      if (error) throw error;
      return ok(data);
    }
    if (req.method === "DELETE") {
      const budgetId = uuidSchema.parse(id);
      const { error } = await ctx.userClient.from("budgets").delete().eq("id", budgetId);
      if (error) throw error;
      return ok({ deleted: true });
    }
    throw new HttpError(405, "method_not_allowed", "Method not allowed");
  } catch (error) {
    return fail(error);
  }
}));
