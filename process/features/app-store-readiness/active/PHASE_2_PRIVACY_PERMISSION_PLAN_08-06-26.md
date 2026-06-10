# Phase 2: Privacy and Permission Surface Plan

Date: 08-06-26
Complexity: Simple
Status: CODE DONE, pending App Store Connect privacy review

## Overview

Reduce unexplained iOS privacy risk and make legal surfaces reachable inside the app.
`process/context/all-context.md` is absent in this checkout; use this plan and package scripts as
the active source of truth.

## Phase Completion Rules

This phase is not VERIFIED until dependency scans pass, legal links are manually checked, App Store
Connect privacy answers match the app, and the user confirms the policy surface.

## Acceptance Criteria

- Unused `expo-location` and `expo-image-picker` packages are removed.
- Profile Privacy Policy route points to `/privacy-policy`.
- Legal and More screens still expose Privacy Policy.
- Production privacy manifest contains no tracking declaration.

## Implementation Checklist

- [x] Remove unused permission-bearing dependencies.
- [x] Update lockfile.
- [x] Fix Profile Privacy Policy route.
- [x] Add release privacy checklist.
- [ ] Complete App Store Connect privacy answers after final legal details are supplied.

## Post-Phase Testing

- `rg "expo-location|expo-image-picker|Privacy Policy\", route: \"/legal\"" apps/mobile pnpm-lock.yaml`
- `pnpm --filter @workspace/slice typecheck`
- Manual check: Profile, More, and Legal screens can reach Privacy Policy.

## Touchpoints

`apps/mobile/package.json`, `pnpm-lock.yaml`, `apps/mobile/app/profile.tsx`, `apps/mobile/docs/ios-app-store-readiness.md`.

## Public Contracts

No API, schema, or subscription contract changes.

## Blast Radius

Mobile dependency graph and legal navigation are affected. App data model and backend are unchanged.

## Verification Evidence

Record scan output, typecheck output, and manual screen navigation result.

## Resume and Execution Handoff

Next Step: complete App Store privacy answers after legal values are finalized. Use RIPER-5
`ENTER EXECUTE MODE` only if App Store review finds another privacy/config gap.
