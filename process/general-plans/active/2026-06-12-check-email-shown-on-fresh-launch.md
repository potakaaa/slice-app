# "Check Your Email" Shown on Cold Launch — Persisted `awaitingEmailConfirmation`

**Created:** 2026-06-12
**Status:** Active
**Type:** Bug fix (SIMPLE)
**Owner:** orchestrator (direct) / vc-execute-agent
**Area:** apps/mobile — auth screen, persisted store

---

## Problem

Repro (reported): install via TestFlight, open the app for the first time. The
first screen rendered is the **"Check your email"** confirmation gate
(`app/auth.tsx`), even though no account has been completed/confirmed.

## Root cause

`awaitingEmailConfirmation` is **transient signup-session UI state** but it is
**persisted** in the Zustand store. The "Check your email" panel
(`app/auth.tsx:114`) is gated solely on this persisted flag:

```tsx
{awaitingEmailConfirmation && !confirmationSignIn ? (<CheckYourEmail/>) : (<AuthForm/>)}
```

It is persisted via `partialize` (`store/useAppStore.ts:224`), so its value
survives a cold launch.

The full chain that puts it on the first screen:

1. Fresh install → `index.tsx` sees no session + `hasSeenOnboarding === false`
   → routes to `/onboarding` (welcome).
2. Welcome screen `onboarding/index.tsx:59-60` (and `:71-72`) calls
   `markOnboardingSeen()` — persisting `hasSeenOnboarding = true` — **before**
   `router.push("/auth?mode=signup")`. So merely tapping "Create Account" on the
   welcome screen permanently flips `hasSeenOnboarding`.
3. On `/auth`, the user submits sign-up. Supabase requires email confirmation,
   so `signUp` returns no session and `app/auth.tsx:78` calls
   `setAwaitingEmailConfirmation(true)` → **persisted as `true`**.
4. The user backgrounds/closes the app to go check their email (or the attempt
   is abandoned). The session is still null (email not yet confirmed / never
   signed in).
5. Next cold launch → `index.tsx`: no session + `hasSeenOnboarding === true`
   → `router.replace("/auth")` → persisted `awaitingEmailConfirmation === true`
   → **"Check your email"** renders as the first screen.

The app should **never** open directly to the "Check your email" gate on a cold
launch. That gate is only meaningful as the immediate result of pressing
"Create Account" within the current session.

### Why `partialize` removal alone is insufficient

Removing `awaitingEmailConfirmation` from `partialize` stops it being *written*
going forward, but existing installs already have `awaitingEmailConfirmation:
true` saved in the AsyncStorage blob. On rehydrate, zustand-persist merges the
full persisted object over defaults, so the stale `true` is merged back in. A
**migration that strips/forces the field** is required to clean existing
installs — consistent with the `persisted-store-needs-migration` project memory.

## Fix strategy

Treat `awaitingEmailConfirmation` as session-scoped, not durable. Stop
persisting it, and clean it out of existing persisted state via a version bump +
migrate. After this, the only way to see "Check your email" is an active sign-up
attempt in the current session.

### Touchpoints

1. **`apps/mobile/store/useAppStore.ts`**
   - **Remove** `awaitingEmailConfirmation` from `partialize` (drop line 224) so
     it is never persisted again. Keep the in-memory state field, default
     `false`, and the `setAwaitingEmailConfirmation` action unchanged (still used
     transiently within the auth screen during a live sign-up).
   - **Bump `version` 4 → 5** and add a migrate branch that removes the stale
     persisted flag so existing installs don't merge `true` back in:
     ```ts
     // v5: awaitingEmailConfirmation is session-scoped UI state and must not
     // survive a cold launch (it was wrongly persisted before v5, causing the
     // "Check your email" gate to be the first screen on relaunch). Strip any
     // persisted value so rehydrate falls back to the in-memory default (false).
     if (version < 5 && persisted && persisted.awaitingEmailConfirmation !== undefined) {
       delete persisted.awaitingEmailConfirmation;
     }
     ```
   - Each migrate check is idempotent; existing v1–v4 branches stay as-is.

2. **`apps/mobile/app/auth.tsx`** (defense-in-depth, recommended)
   - On mount, if there is no in-flight sign-up, ensure the gate starts closed.
     Simplest: in the existing `useEffect` that runs on no-session, or a new
     mount effect, call `setAwaitingEmailConfirmation(false)` when `!session` and
     not mid-submit. This guarantees a clean entry even if some future code path
     re-persists the flag. (Keep it minimal — the store change is the load-bearing
     fix; this is belt-and-suspenders.)

### Why not gate on `hasSeenOnboarding` instead

`hasSeenOnboarding` flipping early (on the welcome tap, before auth completes) is
intentional — it keeps a returning, not-yet-signed-in user on `/auth` rather than
re-showing the welcome carousel. That behavior is correct; the defect is purely
the persisted confirmation gate. Leave the onboarding-seen routing alone.

## Out of scope

- Changing the auth-before-onboarding flow or the `hasSeenOnboarding` routing.
- The separate stale-draft → "Program Ready" bug (see sibling plan
  `2026-06-12-onboarding-skipped-on-signin.md`). Independent fix; do not merge.
- Server-side email-confirmation handling / deep-link on confirm.

## Verification

Manual (device/simulator), since this is navigation/persistence behavior:

1. **Primary repro — abandoned sign-up survives relaunch:**
   - Fresh install → welcome → "Create Account" → enter email/password →
     "Create Account" → "Check your email" appears.
   - Force-quit the app. Relaunch.
   - **Expect (post-fix):** lands on the `/auth` form (Sign In / Create Account
     tabs), **not** "Check your email".
2. **Live sign-up still works in-session:**
   - From the `/auth` form, submit a sign-up needing confirmation.
   - **Expect:** "Check your email" still renders immediately this session, and
     "Back to Sign In" still works.
3. **Confirmed user can sign in:**
   - After confirming the email, relaunch → `/auth` form → Sign In → routed into
     onboarding/dashboard per existing logic.
4. **Migration smoke (existing install with stale flag):**
   - Pre-existing install (v4) with persisted `awaitingEmailConfirmation: true`
     upgrades to v5 → flag stripped on migrate → cold launch shows the `/auth`
     form, not the email gate. No crash.

Tooling: `pnpm` workspace; run typecheck/lint for the mobile app after edits
(confirm script names in `apps/mobile/package.json`, e.g.
`pnpm --filter mobile typecheck`).

## Blast radius

- Auth-screen first-render and persisted store rehydrate path. Files:
  `store/useAppStore.ts`, `app/auth.tsx`. No server/schema/API changes.
- Persisted store `version` bump (4 → 5) affects every existing install's
  rehydrate — covered by the migrate branch above. Only the removed transient
  flag changes; all other persisted fields are untouched.

## Resume handoff

- Start at Touchpoint 1 (store: drop from `partialize` + version bump 4→5 +
  migrate strip). That alone fixes the reported repro on both new and existing
  installs.
- Touchpoint 2 (`auth.tsx` mount reset) is optional hardening; include unless it
  conflicts with the existing `session`-effect ordering at `auth.tsx:50-56`.
