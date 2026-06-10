# SLICE Supabase Backend

This directory is the production backend surface for SLICE.

The Expo app must only use `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and user JWTs. Service-role, Gemini, RevenueCat, Resend, Calendly, and Expo Push credentials belong only in Supabase Edge Function secrets.

## Local Setup

```bash
pnpm install
cp supabase/.env.example supabase/.env.local
supabase start
supabase db reset
supabase secrets set --env-file supabase/.env.local
supabase functions serve --env-file supabase/.env.local
```

The Supabase CLI is required for local DB/function execution. If it is not installed, install it from the official Supabase CLI instructions before running the commands above.

## Validation

```bash
supabase db lint
supabase test db
pnpm --filter @workspace/api-zod run typecheck
pnpm --filter @workspace/db run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/slice run typecheck
```

## Functions

Authenticated user functions:

- `profile-upsert`
- `creditors`
- `debt-program-generate`
- `settlement-calculate`
- `savings-plan-calculate`
- `credit-score`
- `budgets`
- `ai-strategy`
- `ai-script`
- `zest-chat`
- `credit-repair-tasks`
- `coaching-booking`
- `entitlement-sync`
- `referrals`
- `communication-preferences`
- `push-tokens`
- `data-export`
- `account-delete`

Webhook/job functions:

- `revenuecat-webhook`
- `push-schedule-reminders`

## Subscription Gates

- `free`: CRUD, calculators, static credit-repair education.
- `silver`: AI strategy, AI scripts, Zest chat, generated credit repair tasks, 30 AI calls/day.
- `gold`: Silver plus Marc Feinberg coaching booking, 100 AI calls/day.
- `platinum`: Gold plus priority coaching/live-call-ready entitlement, 250 AI calls/day.

RevenueCat entitlement names are mapped by substring:

- `slice_silver` -> `silver`
- `slice_gold` -> `gold`
- `slice_platinum` -> `platinum`

## Security Defaults

- RLS is enabled on all app tables.
- User-owned records are isolated by `auth.uid()`.
- Privileged integrations use service-role only in Edge Functions.
- AI prompts are built server-side and redacted for SSNs, full card/account numbers, and passwords.
- Sensitive operations write `audit_security_logs`.
- Email and push templates avoid sensitive financial details.

SLICE is not a law firm and does not provide legal, tax, financial, or credit advice. SLICE does not guarantee debt settlement, creditor acceptance, or credit score improvement.
