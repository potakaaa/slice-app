# iOS App Store Readiness Umbrella Plan

Date: 08-06-26
Complexity: Complex phase program
Status: PLANNED

## Overview

Prepare SLICE for an iOS-first App Store submission using Expo EAS managed builds. Legal copy
replacement is tracked as an external gate; this plan owns the remaining repo, build, purchase,
backend, QA, and submission readiness work.

## Phase Completion Rules

A phase is complete only after integration testing, manual testing, data/state verification,
error handling review, and user confirmation. Code-only completion is not verified completion.

## Acceptance Criteria

- Preview and production iOS builds resolve through EAS managed profiles.
- Production Expo config uses `https://slice.marcfeinberg.com` or `EXPO_PUBLIC_APP_ORIGIN`, not Replit.
- Production/preview builds do not include the `expo-dev-client` plugin.
- Unused location and image-picker packages are absent from mobile dependencies and lockfile.
- Privacy Policy is reachable from Profile, More, and Legal screens.
- App Store subscriptions, RevenueCat offerings, and Supabase entitlement sync are verified with Apple sandbox.
- Account deletion, data export, auth, onboarding, creditor management, AI gates, and coaching flows pass TestFlight QA.
- Legal placeholders are replaced before App Review submission.

## Phased Delivery Plan

- Phase 0: Confirm Apple Developer, App Store Connect, Expo/EAS, RevenueCat, Supabase, legal, support, website, and demo-account inputs.
- Phase 1: Add iOS EAS build configuration and production-safe Expo config.
- Phase 2: Reduce privacy/permission surface and align in-app legal navigation.
- Phase 3: Verify App Store subscriptions, RevenueCat offerings, webhooks, and entitlement sync.
- Phase 4: Validate production backend secrets, account deletion, data export, gated AI, and coaching flows.
- Phase 5: Submit a production build to TestFlight, complete App Store metadata/privacy answers, and prepare review notes.

## Implementation Checklist

- [x] Create iOS EAS build profiles and environment-aware Expo config.
- [x] Remove unused permission-bearing mobile dependencies from package metadata.
- [x] Fix Profile Privacy Policy navigation.
- [x] Add release readiness docs and phase artifacts.
- [ ] Confirm external account access and final legal values.
- [ ] Run EAS preview build and install on a physical iOS device.
- [ ] Configure App Store Connect subscriptions and RevenueCat offering.
- [ ] Verify sandbox purchase, restore, expiration, and webhook sync.
- [ ] Validate production Supabase secrets and account lifecycle flows.
- [ ] Submit production build to TestFlight and complete App Review package.

## Touchpoints

- Mobile release config: `apps/mobile/app.config.js`, `apps/mobile/eas.json`, `apps/mobile/package.json`.
- User-facing legal navigation: `apps/mobile/app/profile.tsx`, More tab, Legal screen.
- Release documentation: `apps/mobile/docs/ios-app-store-readiness.md`.
- Backend validation surface: Supabase Edge Functions and secrets documented in `supabase/README.md`.

## Public Contracts

- iOS bundle identifier remains `com.slice.debtresolution`.
- RevenueCat package IDs remain `silver_monthly`, `gold_monthly`, `platinum_monthly`.
- Entitlement tier matching remains based on `silver`, `gold`, and `platinum` substrings.
- Required mobile env vars remain public Expo variables only; backend secrets stay in Supabase.

## Blast Radius

- Mobile app release config and dependency graph are affected.
- Static web landing/manifest serving is affected only by reading `app.config.js` instead of `app.json`.
- Android package identifier is preserved; Android submission is not included.
- Supabase schema and Edge Function behavior are not changed by this phase.

## Testing Context

`process/context/all-context.md` and `process/context/tests/all-tests.md` are not present in this checkout;
use `supabase/README.md` and package scripts as the current test routing source.

Post-phase verification includes:

- `pnpm --filter @workspace/slice typecheck`
- `pnpm --filter @workspace/slice test`
- `pnpm --filter @workspace/api-zod run typecheck`
- `pnpm --filter @workspace/db run typecheck`
- `pnpm --filter @workspace/api-server run typecheck`
- EAS preview/production builds when account access is available

## Verification Evidence

Each phase report should record commands run, TestFlight build IDs where applicable, App Store
Connect product IDs, RevenueCat offering screenshots or IDs, Supabase log samples, and manual QA
results.

## Resume and Execution Handoff

Resume from the lowest-numbered phase without documented verification evidence. Do not submit to
App Review until legal placeholders are replaced and Phase 5 has a verified TestFlight build.

Next Step: continue with Phase 0 external access confirmation, then run the Phase 1 EAS preview
build after `EAS_PROJECT_ID`, Apple account access, and Expo account access are available. Use
RIPER-5 `ENTER EXECUTE MODE` only for the next unverified phase.
