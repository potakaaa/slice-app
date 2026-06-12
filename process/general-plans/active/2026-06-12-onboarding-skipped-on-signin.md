# Onboarding Skipped on Sign-In — Stale Draft Routes New Account to "Program Ready"

**Created:** 2026-06-12
**Status:** Active
**Type:** Bug fix (SIMPLE)
**Owner:** orchestrator (direct) / vc-execute-agent
**Area:** apps/mobile — auth + onboarding routing, persisted store

---

## Problem

Repro (reported): create a new account → confirm email → sign in. The instant
"Sign In" is pressed, the app lands on **"Your Program Is Ready"**
(`/onboarding/complete`) even though the user never went through onboarding
(`step1`–`step3`).

## Root cause

The onboarding **draft** lives in the persisted Zustand store
(`apps/mobile/store/useAppStore.ts`): `onboardingReadyForAuth`, `creditors`, and
the local draft `profile`. It is **device-global, not account-scoped**, and is
only cleared in two places:

- `lib/auth.tsx:71` — on explicit `signOut()`
- `app/onboarding/complete.tsx:117` — after finishing onboarding (`clearDraft()`)

Sign-**up** does **not** clear it.

Routing in `app/index.tsx:26-38` for an authenticated user:

```
if (profile.onboardingComplete)   → /(tabs)
else if (onboardingReadyForAuth)  → /onboarding/complete   ("Your Program Is Ready")
else                              → /onboarding/step1
```

The disagreement that causes the bug:

- `profile.onboardingComplete` is read from the **server** via `useProfile()`
  (`lib/sliceData.ts:234`) — `false` for a brand-new account.
- `onboardingReadyForAuth` + `creditors` are read from the **local persisted
  store** — can be left `true`/populated by a *previous* run.

`onboardingReadyForAuth` is set `true` by `markOnboardingReady()`
(`store/useAppStore.ts:121`), called from `app/onboarding/step3.tsx:102`. If a
prior onboarding attempt reached `step3` but the user never tapped "Start My
Program" (`complete.tsx` `handleStart`) and never signed out, the flag and
`creditors` stay persisted.

Then a new account signs in:

1. `index.tsx`: server `onboardingComplete === false` + stale
   `onboardingReadyForAuth === true` → `router.replace("/onboarding/complete")`.
2. `complete.tsx:79` guard `!onboardingReadyForAuth || creditors.length === 0`
   is **false** (stale draft satisfies both) → it renders "Your Program Is
   Ready" using the previous run's draft data instead of bouncing back.

This is the reported symptom.

### Why a truly-fresh device does NOT hit it

On a clean install the flow is correct: `onboarding` (welcome) → `auth?mode=signup`
→ confirm email → sign in → `index.tsx` sees `onboardingReadyForAuth === false`
→ `/onboarding/step1`. The bug requires a **leftover draft** from an abandoned
prior onboarding on the same device (common during testing / account churn).

## Fix strategy

Scope the onboarding draft to the authenticated user that created it. Stamp the
draft with an owner user id when it becomes "ready", and have the root router
discard a draft whose owner is not the currently signed-in user.

Chosen approach because:
- `index.tsx` is the single routing chokepoint and already has `user.id` (via
  `useAuth`/`useProfile`) and the authoritative server `onboardingComplete`.
- An owner stamp is a reliable discriminator across the auth boundary; clearing
  on sign-in alone is insufficient (app re-open mid-onboarding doesn't re-run
  sign-in, and we still want legit same-user resume to work).

### Touchpoints

1. **`apps/mobile/store/useAppStore.ts`**
   - Add persisted field `draftOwnerId: string | null` (default `null`).
   - `markOnboardingReady(ownerId: string)` — accept the owner id and set
     `draftOwnerId: ownerId` alongside the existing fields.
   - `clearDraft()` — reset `draftOwnerId: null` (so a cleared device can't claim
     ownership for the next account).
   - Add `draftOwnerId` to `partialize`.
   - **Persisted-store migration (required):** bump `version` 3 → 4 and add a
     migrate branch that backfills `draftOwnerId: null` when absent. Per the
     `persisted-store-needs-migration` project memory, new persisted fields must
     have version + migrate or existing installs inherit the initial value
     non-deterministically. With default `null`, any existing install's pending
     `onboardingReadyForAuth` draft becomes "unowned" → treated as foreign →
     user restarts onboarding from `step1` (correct: we cannot prove ownership).
     Installs that already finished onboarding are unaffected (server
     `onboardingComplete === true` short-circuits the guard).

2. **`apps/mobile/app/onboarding/step3.tsx`**
   - `handleFinish` already has `session` from `useAuth()`. Pass the owner id:
     `markOnboardingReady(session?.user.id ?? "")`. (When there is no session the
     value is irrelevant — `handleFinish` routes to `/auth` in that branch.)

3. **`apps/mobile/app/index.tsx`** (the actual fix)
   - Read `draftOwnerId` and `clearDraft` from the store.
   - In the authenticated + `!onboardingComplete` branch, compute:
     `const draftValid = onboardingReadyForAuth && draftOwnerId === user.id;`
   - If `onboardingReadyForAuth && !draftValid` → call `clearDraft()` (discard the
     foreign/stale draft) before routing.
   - Route: `router.replace(draftValid ? "/onboarding/complete" : "/onboarding/step1")`.
   - Keep the existing `celebrate("m1_registered", { once: true })` — a new user
     sent to `step1` is still genuinely newly-registered; `once` dedupes.
   - Add `draftOwnerId`, `clearDraft`, and `user?.id` to the effect dependency
     array.

4. **`apps/mobile/app/onboarding/complete.tsx`** (defense-in-depth, optional)
   - Extend the redirect guard (`complete.tsx:79`) to also bounce when the draft
     owner is not the current user:
     `if (!onboardingReadyForAuth || creditors.length === 0 || draftOwnerId !== session.user.id)`.
   - Low cost; protects against any future caller routing here directly. Include
     unless it complicates the existing `clearDraft`-before-navigate ordering in
     `handleStart`.

## Out of scope

- Server-side reconciliation of an in-progress draft (we keep drafts local).
- Changing the auth-before-onboarding flow itself.
- Reworking `awaitingEmailConfirmation` handling.

## Verification

Manual (device/simulator), since this is navigation/persistence behavior:

1. **Primary repro — foreign stale draft:**
   - Sign in as account A, run onboarding through `step3` (do NOT tap "Start My
     Program"). Confirm `onboardingReadyForAuth`/`creditors`/`draftOwnerId=A`
     persisted.
   - Without signing out, navigate to `/auth`, create + confirm account B, sign in.
   - **Expect:** lands on `/onboarding/step1` (not "Your Program Is Ready"); the
     stale draft is cleared.
2. **Legit resume — same user:**
   - As account B, complete `step1`–`step3` (`draftOwnerId=B`), force-quit the app
     at the "complete" screen.
   - Relaunch.
   - **Expect:** returns to `/onboarding/complete` and resumes correctly.
3. **Happy path — fresh account:**
   - Clean install → welcome → signup → confirm → sign in.
   - **Expect:** `/onboarding/step1`, full onboarding, "Start My Program" →
     `/(tabs)`.
4. **Returning completed user:**
   - Account that finished onboarding (server `onboardingComplete === true`) signs
     in.
   - **Expect:** straight to `/(tabs)`; guard never runs.
5. **Migration smoke:**
   - Pre-existing install with an in-progress draft (no `draftOwnerId`) upgrades
     to v4 → `draftOwnerId` backfills to `null` → on next sign-in, draft treated
     as unowned → `/onboarding/step1`. No crash, no inherited "Program Ready".

Tooling: `pnpm` workspace; run typecheck/lint for the mobile app after edits
(`pnpm --filter mobile typecheck` / equivalent — confirm script names in
`apps/mobile/package.json`).

## Blast radius

- All sign-in / onboarding entry routing. Files: `store/useAppStore.ts`,
  `app/index.tsx`, `app/onboarding/step3.tsx`, optionally
  `app/onboarding/complete.tsx`. No server/schema/API changes.
- Persisted store version bump affects every existing install's rehydrate path —
  covered by the migrate branch above.

## Resume handoff

- Start at Touchpoint 1 (store) → 2 (step3) → 3 (index.tsx) → 4 (complete.tsx
  optional). The index.tsx guard is the load-bearing change; the owner stamp
  exists to feed it.
- If only a minimal patch is wanted, Touchpoints 1+3 (with a sign-in-time clear)
  fix the reported repro, but the owner stamp is what keeps legit resume working.
