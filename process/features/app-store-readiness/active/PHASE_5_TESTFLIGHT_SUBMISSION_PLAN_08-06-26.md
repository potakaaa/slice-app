# Phase 5: TestFlight and App Store Submission Plan

Date: 08-06-26
Complexity: Complex
Status: PLANNED

## Overview

Prepare a production iOS build and App Store Connect package for review. `process/context/all-context.md`
is absent in this checkout; use the umbrella plan and release checklist as routing context.

## Phase Completion Rules

This phase is not VERIFIED until production build, TestFlight install, manual iOS QA, metadata,
privacy answers, screenshots, review notes, and user confirmation are complete.

## Acceptance Criteria

- Final legal values are present in Privacy Policy and Terms.
- Production EAS build is uploaded to TestFlight.
- Physical-device QA covers core free, paid, export, deletion, and sign-out flows.
- App Store metadata, screenshots, support URL, privacy policy URL, and privacy answers are complete.
- App Review notes include demo credentials and paid-feature instructions.

## Implementation Checklist

- [ ] Replace final legal placeholders.
- [ ] Run production EAS build.
- [ ] Submit latest build to TestFlight.
- [ ] Complete physical-device QA.
- [ ] Complete App Store Connect metadata and submit for review.

## Post-Phase Testing

- `eas build --platform ios --profile production`
- `eas submit --platform ios --profile production --latest`
- Manual Test: auth, onboarding, creditors, calculators, paid tiers, restore, export, deletion, and sign-out.

## Touchpoints

EAS Build, App Store Connect, TestFlight, legal screens, release checklist.

## Public Contracts

Submitted app metadata must match in-app pricing, legal copy, and subscription behavior.

## Blast Radius

Public App Store submission package and review outcome are affected.

## Verification Evidence

Record production build ID, TestFlight build number, QA notes, screenshots, and submitted metadata.

## Resume and Execution Handoff

Next Step: start only after Phases 1-4 and legal placeholder replacement are verified. Use RIPER-5
`ENTER EXECUTE MODE` only if App Review/TestFlight exposes a repo-side fix.
