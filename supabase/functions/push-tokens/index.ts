import { withCors } from "../_shared/cors.ts";
import { fail, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { pushTokenSchema } from "../_shared/schemas.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const body = pushTokenSchema.parse(await readJson(req));
    const { data, error } = await ctx.userClient
      .from("push_notification_tokens")
      .upsert({
        ...body,
        user_id: ctx.user.id,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "user_id,expo_token" })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}));
