# Phase 4: Backend and Account Lifecycle Plan

Date: 08-06-26
Complexity: Complex
Status: PLANNED

## Overview

Verify production backend behavior that App Review and users depend on. `process/context/all-context.md`
is absent in this checkout; use `supabase/README.md` and function source as backend context.

## Phase Completion Rules

This phase is not VERIFIED until account creation, data export, account deletion, gated feature
errors, and relevant Supabase logs are tested and user-confirmed.

## Acceptance Criteria

- Production Supabase secrets required by enabled features are present.
- Authenticated user data remains user-scoped.
- Account deletion removes the Supabase auth user.
- Data export returns only the authenticated user's records.
- AI/coaching failures are graceful when providers fail.

## Implementation Checklist

- [ ] Confirm Supabase production secrets and deployed migrations.
- [ ] Prepare demo account with realistic non-sensitive data.
- [ ] Test account creation, onboarding, creditors, export, deletion, AI gates, and coaching.
- [ ] Inspect Supabase logs for expected authenticated calls.
- [ ] Document any provider-specific failure modes.

## Post-Phase Testing

- `pnpm --filter @workspace/api-zod run typecheck`
- `pnpm --filter @workspace/db run typecheck`
- `pnpm --filter @workspace/api-server run typecheck`
- `supabase db lint` and `supabase test db` if local Supabase is configured.

## Touchpoints

Supabase Edge Functions, Supabase secrets, `supabase/README.md`, mobile account lifecycle screens.

## Public Contracts

No planned schema or API contract changes unless verification finds a defect.

## Blast Radius

Backend secrets, deployed functions, account lifecycle, and provider integrations are affected.

## Verification Evidence

Record typecheck output, function logs, account deletion proof, data export sample shape, and manual QA notes.

## Resume and Execution Handoff

Next Step: run this phase after Phase 3 purchase verification or in parallel once Supabase production access is confirmed.
Use RIPER-5 `ENTER EXECUTE MODE` only for defects found during backend validation.
