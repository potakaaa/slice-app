import { withCors } from "../_shared/cors.ts";
import { adminClient } from "../_shared/auth.ts";
import { fail, ok } from "../_shared/errors.ts";
import { sendExpoPush } from "../_shared/expoPush.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const admin = adminClient();
    const now = new Date().toISOString();
    const { data: reminders, error } = await admin
      .from("scheduled_notifications")
      .select("id,user_id,title,body,type")
      .lte("scheduled_for", now)
      .is("sent_at", null)
      .is("cancelled_at", null)
      .limit(100);
    if (error) throw error;
    const userIds = [...new Set((reminders ?? []).map((item) => item.user_id))];
    const { data: tokens, error: tokenError } = await admin
      .from("push_notification_tokens")
      .select("user_id,expo_token")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("enabled", true);
    if (tokenError) throw tokenError;

    const messages = (reminders ?? []).flatMap((reminder) =>
      (tokens ?? [])
        .filter((token) => token.user_id === reminder.user_id)
        .map((token) => ({ to: token.expo_token, title: reminder.title, body: reminder.body, data: { type: reminder.type } }))
    );
    const result = await sendExpoPush(messages);
    if ((reminders ?? []).length > 0) {
      await admin.from("scheduled_notifications").update({ sent_at: now }).in("id", reminders!.map((item) => item.id));
    }
    return ok({ processed: reminders?.length ?? 0, ...result });
  } catch (error) {
    return fail(error);
  }
}));
