import { withCors } from "../_shared/cors.ts";
import { fail, ok, readJson } from "../_shared/errors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { coachingBookingSchema } from "../_shared/schemas.ts";
import { requireTier } from "../_shared/subscriptions.ts";
import { createCalendlyBooking } from "../_shared/calendly.ts";
import { sendEmail } from "../_shared/email.ts";

Deno.serve((req) => withCors(req, async () => {
  try {
    const ctx = await requireAuth(req);
    const body = coachingBookingSchema.parse(await readJson(req));
    const tier = await requireTier(ctx.adminClient, ctx.user.id, "gold");
    const priority = tier === "platinum";
    const calendly = await createCalendlyBooking({
      name: ctx.user.email ?? "SLICE user",
      email: ctx.user.email ?? "",
      topic: body.topic,
      notes: body.notes,
      priority,
    });

    const { data, error } = await ctx.adminClient.from("coaching_bookings").insert({
      user_id: ctx.user.id,
      tier_at_booking: tier,
      topic: body.topic,
      notes: body.notes ?? null,
      calendly_event_uri: calendly.uri,
      starts_at: calendly.startsAt,
      priority,
      status: "pending",
    }).select().single();
    if (error) throw error;
    if (ctx.user.email) {
      await sendEmail({
        to: ctx.user.email,
        subject: "SLICE coaching request received",
        html: `<p>Your coaching request for <strong>${body.topic}</strong> was received. Marc Feinberg's team will follow up with scheduling details.</p>`,
      });
    }
    return ok({ booking: data, calendly });
  } catch (error) {
    return fail(error);
  }
}));
