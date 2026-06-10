# Phase 3: Purchases and Entitlement Verification Plan

Date: 08-06-26
Complexity: Complex
Status: PLANNED

## Overview

Verify iOS subscriptions end-to-end across App Store Connect, RevenueCat, the mobile app, and
Supabase entitlement sync. `process/context/all-context.md` is absent in this checkout; use
`supabase/README.md` for backend contract routing.

## Phase Completion Rules

This phase is not VERIFIED until sandbox purchase, restore, webhook sync, expiration/downgrade, and
Supabase tier updates are manually tested and user-confirmed.

## Acceptance Criteria

- App Store Connect has monthly subscriptions for `silver_monthly`, `gold_monthly`, and `platinum_monthly`.
- RevenueCat current offering exposes all three products.
- RevenueCat entitlements contain `silver`, `gold`, and `platinum`.
- Supabase secrets are set for RevenueCat API and webhook.
- Mobile purchase and restore update profile tier correctly.

## Implementation Checklist

- [ ] Create or verify App Store Connect subscriptions.
- [ ] Configure RevenueCat products, offering, and entitlements.
- [ ] Set `REVENUECAT_API_KEY` and `REVENUECAT_WEBHOOK_SECRET` in Supabase.
- [ ] Configure RevenueCat webhook to the deployed `revenuecat-webhook` function.
- [ ] Test sandbox purchase, restore, cancellation/expiration, and entitlement sync.

## Post-Phase Testing

- `pnpm --filter @workspace/slice test`
- Sandbox purchase each paid tier.
- Restore purchases after sign-out/sign-in.
- Inspect Supabase profile tier and Edge Function logs.

## Touchpoints

RevenueCat dashboard, App Store Connect, Supabase Edge Function secrets, `apps/mobile/lib/revenueCat.tsx`.

## Public Contracts

Package IDs stay `silver_monthly`, `gold_monthly`, `platinum_monthly`; tier matching stays tier-name based.

## Blast Radius

Paid feature access and subscription state are affected. Free-tier app flows should remain unchanged.

## Verification Evidence

Record App Store product IDs, RevenueCat offering/entitlement IDs, sandbox transaction results, and Supabase logs.

## Resume and Execution Handoff

Next Step: start only after App Store Connect and RevenueCat access are available. Use RIPER-5
`ENTER EXECUTE MODE` for any required code changes discovered during sandbox testing.
