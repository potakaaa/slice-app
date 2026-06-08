# Phase 1: iOS Build Configuration Plan

Date: 08-06-26
Complexity: Simple
Status: CODE DONE, pending EAS build verification

## Overview

Make the mobile app buildable for iOS release through Expo EAS managed builds while keeping
development builds available. `process/context/all-context.md` is absent in this checkout; use
the umbrella plan and `supabase/README.md` for current routing.

## Phase Completion Rules

This phase is not VERIFIED until automated checks pass, an EAS preview build completes, the build
installs on an iOS device, and the user confirms it opens.

## Acceptance Criteria

- EAS has development, preview, and production iOS build profiles.
- Production-like Expo config uses the production app origin.
- Development-client plugin is excluded from preview and production config.
- iOS bundle identifier remains `com.slice.debtresolution`.
- Static server can read `app.config.js`.

## Implementation Checklist

- [x] Add `apps/mobile/eas.json`.
- [x] Replace static Expo config with `apps/mobile/app.config.js`.
- [x] Gate `expo-dev-client` plugin to development builds.
- [x] Preserve Android package identifier.
- [ ] Run EAS preview build from `apps/mobile`.

## Post-Phase Testing

- `pnpm --filter @workspace/slice typecheck`
- `pnpm --filter @workspace/slice test`
- `APP_VARIANT=production pnpm --filter @workspace/slice exec expo config --json`
- `eas build --platform ios --profile preview`

## Touchpoints

`apps/mobile/app.config.js`, `apps/mobile/eas.json`, `apps/mobile/server/serve.js`.

## Public Contracts

The iOS bundle identifier, app scheme, and RevenueCat package IDs are unchanged.

## Blast Radius

Expo config resolution and static build serving are affected. Supabase schema and app behavior are unchanged.

## Verification Evidence

Record command output, EAS build ID, and iOS install/open result.

## Resume and Execution Handoff

Next Step: run the EAS preview build after Apple/Expo access and `EAS_PROJECT_ID` are available.
Use RIPER-5 `ENTER EXECUTE MODE` only if this phase needs further repo edits.
