import { optionalEnv, LEGAL_DISCLAIMER } from "./env.ts";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = optionalEnv("RESEND_API_KEY");
  const from = optionalEnv("RESEND_FROM_EMAIL");
  if (!apiKey || !from) {
    console.warn("email_skipped_missing_resend_env", input.subject);
    return { skipped: true };
  }

  const html = `${input.html}<p style="font-size:12px;color:#667085">${LEGAL_DISCLAIMER}</p>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html }),
  });

  if (!res.ok) {
    console.error("resend_error", res.status, (await res.text()).slice(0, 500));
  }
  return { skipped: false, status: res.status };
}
