import { withCors } from "../_shared/cors.ts";
import { fail, HttpError, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { creditorInputSchema, creditorPatchSchema } from "../_shared/schemas.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (req.method === "GET") {
      const query = ctx.userClient.from("creditors").select("*").order("priority", { ascending: true });
      const { data, error } = id ? await query.eq("id", id).single() : await query;
      if (error) throw error;
      return ok(data);
    }

    if (req.method === "POST") {
      const body = creditorInputSchema.parse(await readJson(req));
      const { data, error } = await ctx.userClient
        .from("creditors")
        .insert({ ...body, user_id: ctx.user.id })
        .select()
        .single();
      if (error) throw error;
      return ok(data, { status: 201 });
    }

    if (req.method === "PATCH") {
      const body = creditorPatchSchema.parse(await readJson(req));
      const { id: creditorId, ...updates } = body;
      const creditors = ctx.userClient.from("creditors");
      // An update with no fields issues an empty UPDATE that matches 0 rows
      // (PGRST116) and surfaces as a generic 500. Treat a no-op save as a read.
      const { data, error } = Object.keys(updates).length === 0
        ? await creditors.select("*").eq("id", creditorId).single()
        : await creditors.update(updates).eq("id", creditorId).select().single();
      if (error) throw error;
      return ok(data);
    }

    if (req.method === "DELETE") {
      if (!id) throw new HttpError(400, "missing_id", "Creditor id is required");
      const { error } = await ctx.userClient.from("creditors").delete().eq("id", id);
      if (error) throw error;
      return ok({ deleted: true });
    }

    throw new HttpError(405, "method_not_allowed", "Method not allowed");
  } catch (error) {
    return fail(error);
  }
}));
