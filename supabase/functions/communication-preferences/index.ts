import { withCors } from "../_shared/cors.ts";
import { fail, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { communicationPreferencesSchema } from "../_shared/schemas.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const body = communicationPreferencesSchema.parse(await readJson(req));
    const { data, error } = await ctx.userClient
      .from("profiles")
      .update(body)
      .eq("id", ctx.user.id)
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}));
