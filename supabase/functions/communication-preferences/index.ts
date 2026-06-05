import { withCors } from "../_shared/cors.ts";
import { fail, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { communicationPreferencesSchema } from "../_shared/schemas.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const body = communicationPreferencesSchema.parse(await readJson(req));
    const profiles = ctx.userClient.from("profiles");
    // An update with no fields issues an empty UPDATE that matches 0 rows
    // (PGRST116) and surfaces as a generic 500. Treat a no-op save as a read.
    const { data, error } = Object.keys(body).length === 0
      ? await profiles.select("*").eq("id", ctx.user.id).single()
      : await profiles.update(body).eq("id", ctx.user.id).select().single();
    if (error) throw error;
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}));
