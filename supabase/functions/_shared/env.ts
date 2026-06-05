export function env(name: string, fallback?: string): string {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return Deno.env.get(name) || undefined;
}

export const LEGAL_DISCLAIMER =
  "SLICE is not a law firm and does not provide legal, tax, financial, or credit advice. SLICE does not guarantee debt settlement, creditor acceptance, or credit score improvement.";

export const legalVersions = () => ({
  termsVersion: env("LEGAL_TERMS_VERSION", "2026-06-05"),
  privacyVersion: env("LEGAL_PRIVACY_VERSION", "2026-06-05"),
});
