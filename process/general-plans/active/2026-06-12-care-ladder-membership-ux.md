# The Care Ladder — Membership Voice & UX Across the App

**Date:** 2026-06-12
**Author:** Plan (UX-focused) — SLICE mobile membership
**Status:** Active — plan complete, implementation not started.

---

## The idea (product owner's note)

Two goals govern everything: **(1) celebrate with them** and **(2) be simple and user-friendly.**

The membership tiers are framed with the analogy: *you fell and you're in pain.*

| Tier | The analogy | The emotional promise |
|---|---|---|
| **Free** | "We see you're in pain. We're here for you. We're here to help." | **We see you.** Presence + clarity. You are not alone. |
| **Silver** | A friend helps you up, walks you to the car, drives you to the hospital. | **We help you up.** The words to say, an AI coach moving you forward. |
| **Gold** | Gets you out of the car and inside the hospital. | **We walk you in the door.** A real human (Marc) guiding you weekly. |
| **Platinum** | Gets you to a doctor, puts the cast on, gives pain medication. | **We do it with you.** Done-with-you calls + repair until you're treated. |

The throughline: **each tier is "more done *with* you," told in the language of care, not features.**

---

## Core finding from the audit

The analogy is **already latent** in the product — it just isn't expressed consistently:

- `lib/tierBenefits.ts` `TIER_META` taglines are half care / half feature: Platinum = *"We do it with you"* (✅ care), but Silver = *"AI-powered negotiation"* (❌ feature), Gold = *"Coaching + AI, every week"* (❌ feature), Free = *"Your debt toolkit"* (❌ feature).
- `UpgradeNudgeDialog.tsx` already nails the target voice: *"You're doing the hard part — facing your debt head-on. Imagine doing it with an AI coach in your corner."* This is the model. Extend it everywhere.
- Everywhere else, tiers are sold as **feature bullets and locks** (`UpgradePrompt` = a padlock + "available on the X plan and above"; `pricing.tsx` = check-list cards; dashboard free card = "Unlock AI tools"). Transactional, not caring.
- **Free users mostly get sold to, not supported.** The analogy says Free = *"we're here for you."* Today Free's only tier-specific dashboard element is an upsell card. There is no "you're not alone" presence — a gap against goal (1).

**Conclusion:** This is primarily a **narrative + UX consistency** initiative, not a feature/pricing restructure. One source-of-truth voice layer, threaded through ~8 surfaces, plus rebalancing Free so it *feels* supported.

> **Decision needed (flag for product owner):** This plan assumes tier **contents and prices stay as-is** (Free toolkit / Silver AI / Gold coaching / Platinum done-with-you) and we reframe the *voice and UX*. If you also want to restructure what each tier includes (e.g. give Free a true "presence/check-in" feature, or rename tiers to Bronze/Silver/Gold/Platinum-style care names), that's a larger scope — call it out and we add a Workstream E.

---

## Current tier surfaces (audit map)

| Surface | File | Today | Voice |
|---|---|---|---|
| Tier metadata (SoT) | `lib/tierBenefits.ts` | taglines + feature lists + AI limits | mixed |
| Tier badge | `components/TierBadge.tsx` | label + icon chip | neutral |
| Dashboard tier card | `app/(tabs)/index.tsx:159–197` | free → "Unlock AI tools"; paid → "View your member benefits" | transactional |
| Membership hub | `app/membership.tsx` | gradient hero (tagline), unlocked list, AI meters, value stats, resources, next-tier upsell | mixed |
| Pricing | `app/pricing.tsx` | 4 feature-list cards, billing toggle, trust points | feature-driven |
| Upgrade gate (inline) | `components/UpgradePrompt.tsx` | padlock + "available on X plan and above" | cold lock |
| Weekly nudge | `components/UpgradeNudgeDialog.tsx` | warm momentum copy | ✅ target voice |
| Coaching gate | `app/coaching.tsx:117` | Marc card + UpgradePrompt(gold) | mixed |
| Upgrade celebration | `app/pricing.tsx:397` `CelebrationOverlay` | "Silver Unlocked!" | feature, not relationship |
| Onboarding welcome | `app/onboarding/index.tsx` | "Get Started — It's Free" + 3 features | functional |

Gates that render `UpgradePrompt`: `ai/strategy/[id].tsx`, `ai/script/[id].tsx`, `credit-repair.tsx`, `creditor/[id].tsx`, `coaching.tsx` — all inherit the cold-lock voice and all improve for free once `UpgradePrompt` is reframed.

---

## Design principles for this work

1. **Care, not features.** Lead every tier surface with the *emotional promise* ("We help you up"), then let features substantiate it. Features become the *evidence* of care, not the pitch.
2. **"We / you," never "it / the plan."** Partnership voice. The app is a companion walking beside someone in pain, escalating how much it carries.
3. **Free is supported, not just sold.** A free user must feel *seen* before they're ever asked to upgrade. Presence first; invitation second, gentle, dismissible.
4. **Make the ladder visible.** The escalation of help ("more done *with* you") should be a tangible, single visual — the user sees where they are and what deeper help feels like.
5. **Celebrate the relationship at upgrade.** Upgrading isn't unlocking a feature; it's gaining a deeper level of help. The celebration says "you've got us in your corner now."
6. **Reuse, don't reinvent.** Source the voice from one place (`tierBenefits.ts`); reuse `TIER_META`, gradients, `useColors`, existing celebration system. No new dependencies.
7. **One voice with the dashboard work.** This shares both goals with the active `2026-06-12-dashboard-whole-program-celebrate.md` plan and its "suggest, never dictate" voice. Keep them consistent — warm, alongside-you, never commanding.

---

## Workstream A — The Care Ladder voice layer (single source of truth)

### A1. Extend `TIER_META` with care fields — P0, S
**What:** Add to `TierMeta` in `lib/tierBenefits.ts`:
```ts
interface TierMeta {
  // ...existing
  /** One-line emotional promise — the "what we do for you" in human terms. */
  promise: string;        // Free: "We see you, and we're here."
  /** The care-ladder analogy line (the helping-hand metaphor, plain). */
  careLine: string;       // Silver: "We help you up and get you moving."
  /** Short reassurance shown to current members of this tier. */
  presence: string;       // Free: "Your whole picture, clear — you're not doing this alone."
}
```
Proposed copy (tunable with product owner):
- **free** — promise: *"We see you, and we're here."* · careLine: *"We help you see the whole picture clearly."* · presence: *"You're not doing this alone."*
- **silver** — promise: *"We help you up."* · careLine: *"An AI coach drafts the exact words to settle for less."* · presence: *"You've got the words and a coach in your corner."*
- **gold** — promise: *"We walk you in the door."* · careLine: *"Marc guides you live, every week, one-on-one."* · presence: *"A real person is guiding you now."*
- **platinum** — promise: *"We do it with you."* · careLine: *"We get on the creditor calls and negotiate beside you."* · presence: *"We're on the calls with you, start to finish."*

Replace the feature-y `tagline`s with care-first language, OR keep `tagline` as the short feature descriptor and add `promise` as the lead (recommended: keep both, lead with `promise`).
**Why:** One edit point feeds every surface, guaranteeing a consistent voice. Mirrors how the file already centralizes color/gradient/benefits.
**Files:** `apps/mobile/lib/tierBenefits.ts`.
**Verification:** Type-checks; all four tiers have non-empty `promise`/`careLine`/`presence`.

### A2. (Optional) `careLadder()` helper — P2, S
**What:** A small selector returning the ordered ladder `[{tier, promise, careLine, reached}]` given the user's current tier, so the ladder visual (C2) and any "what's next" copy read from one place.
**Files:** `lib/tierBenefits.ts`.

---

## Workstream B — Reframe the gate & nudge voice (highest leverage)

### B1. `UpgradePrompt.tsx` — lock → invitation — P0, M
**What:** Replace the padlock-led "available on the X plan and above" with care voice:
- Lead with `TIER_META[requiredTier].promise` (e.g. "We walk you in the door").
- Soften the icon (the tier's own icon, not a padlock) — or keep a small lock but make the headline the *promise*, the body the *help*, not the restriction.
- Keep the benefit bullets (they're the evidence) and the CTA, but the CTA reads `Continue with {tier}` / `Bring {tier} into your corner` rather than a bare "Upgrade".
**Why:** This single component is the gate on 5 screens (AI strategy/script, credit-repair, creditor detail, coaching). Reframing it once warms every locked surface.
**Files:** `apps/mobile/components/UpgradePrompt.tsx`. Verify the 5 call sites still pass sensible `feature`/`description` (or let the component default to `promise`/`careLine` when `description` is omitted).
**Verification:** Each gate screen shows the tier's promise + help, no cold "not available" framing; CTA routes to `/pricing`.

### B2. `UpgradeNudgeDialog.tsx` — keep voice, source from SoT — P2, S
**What:** Already the model voice — minimal change. Optionally pull the headline/subtitle emphasis from `TIER_META.silver.promise` so future copy edits stay centralized. Preserve all cadence/eligibility logic untouched.
**Files:** `apps/mobile/components/UpgradeNudgeDialog.tsx`.
**Guard:** Do **not** touch the 7-day cadence, `sessionCount > 1`, celebration-suppression, or `markUpgradePrompted()` timing.

### B3. Upgrade celebration → relationship moment — P1, S
**What:** In `pricing.tsx`, the post-purchase `CelebrationOverlay` title "{Tier} Unlocked!" → relationship framing using `promise`: e.g. title `Welcome to {Tier}`, message `{promise} — {first two headline benefits}`. (Platinum: "We do it with you — done-with-you calls, credit repair toolkit.")
**Why:** Goal (1): the upgrade is a moment to celebrate gaining deeper help, not unlocking SKUs.
**Files:** `apps/mobile/app/pricing.tsx:151–154, 397–405`.

---

## Workstream C — Make the ladder visible & supportive

### C1. Dashboard tier card — presence + care — P0, M
**What:** In `app/(tabs)/index.tsx:159–197`:
- **Free card:** stop leading with "Unlock AI tools." Lead with presence + a gentle next step: eyebrow "WE'RE HERE WITH YOU", title using free `presence`, then a soft invitation ("When you're ready, we can help you up →"). Keep it dismissible/non-naggy (the weekly nudge already handles harder asks).
- **Paid card:** show the tier's `presence` line under the gradient `TierBadge` instead of generic "View your member benefits" (e.g. Gold: "A real person is guiding you now. View your benefits →").
**Why:** Goal (1) + principle 3 — free users feel seen on the home screen, not just sold to; paid users feel the relationship they bought.
**Files:** `apps/mobile/app/(tabs)/index.tsx` (`tierCard` block + styles).
**Verification:** Free dashboard reads as support-first; paid reads as relationship; both still tap through (`/pricing` / `/membership`).
**Coordination:** This block sits directly above `ProgramSnapshotHero` from the dashboard-celebrate plan — implement after/with that plan so ordering stays coherent.

### C2. Care-Ladder visual on Pricing + Membership — P1, M
**What:** A compact vertical "ladder" component (`components/CareLadder.tsx`, presentational) rendering the 4 rungs with `promise` + one-line `careLine`, the user's current rung highlighted and rungs below marked "you have this," rungs above marked "deeper help when you're ready." Place at the top of `pricing.tsx` (replacing/with the generic subtitle) and optionally on `membership.tsx`.
**Why:** Principle 4 — the escalation of *care* becomes one glanceable picture; reframes pricing from "compare features" to "how much help do you want beside you."
**Files:** new `apps/mobile/components/CareLadder.tsx`; `apps/mobile/app/pricing.tsx` (header); optionally `membership.tsx`.
**Verification:** Renders all 4 rungs from `TIER_META`; current tier highlighted; reads top-to-bottom as escalating help; reuses tier colors/gradients.

### C3. Pricing copy reframe — P1, S
**What:** `pricing.tsx` subtitle "Choose the plan that fits your debt resolution journey" → care framing: "Choose how much help you want beside you. You can change it anytime." Per-plan, add the `promise` as a one-line header under the plan name (above price), so each card leads with care then substantiates with features.
**Files:** `apps/mobile/app/pricing.tsx`.

### C4. Membership hub — lead with the promise — P1, S
**What:** In `membership.tsx`, render `meta.promise` prominently in/under the gradient hero (it currently shows `meta.tagline`). Reframe the next-tier upsell card "Unlock more with {X}" → "{promise of next tier}" as the headline, features as bullets beneath. "What you've unlocked" → "What we're doing with you" for paid tiers.
**Files:** `apps/mobile/app/membership.tsx`.

---

## Workstream D — Human face & onboarding presence

### D1. Surface the human at the higher rungs — P2, S
**What:** Gold/Platinum are "a real person / done with you." Reinforce with Marc's portrait (`assets/marc/marc-portrait.jpeg`, already used in `coaching.tsx`) on the Gold/Platinum rung of the Care Ladder and on the coaching gate headline, so "we walk you in / do it with you" feels like a real human, not a feature. Reframe the coaching `UpgradePrompt` description toward the promise voice (B1 covers the component; this tunes the call-site copy).
**Files:** `apps/mobile/app/coaching.tsx`, `components/CareLadder.tsx`.

### D2. Onboarding presence seed — P2, S
**What:** On `onboarding/index.tsx`, add one care line near the CTA reflecting Free's promise ("We see you. Let's look at the whole picture together — free.") so the "we're here for you" relationship starts before signup. Keep the existing free-first, no-credit-card framing.
**Files:** `apps/mobile/app/onboarding/index.tsx`.
**Note:** `onboarding/complete.tsx` savings copy is owned by the dashboard-celebrate plan (D1 there) — don't double-edit; coordinate.

---

## Out of scope (backlog candidates)

- Restructuring tier **contents or pricing** (gated behind the "Decision needed" flag above → would become Workstream E).
- A new RevenueCat product / billing change.
- A literal "fell / hospital" illustration set — the analogy guides *voice*, not literal medical imagery (could feel off for a finance app). Validate tone with product owner before any imagery.
- Net-new celebration milestone keys (reuse existing `celebrate` system).

---

## Touchpoints summary

| File | Change | Priority |
|---|---|---|
| `apps/mobile/lib/tierBenefits.ts` | Add `promise`/`careLine`/`presence` to `TIER_META`; optional `careLadder()` | P0 |
| `apps/mobile/components/UpgradePrompt.tsx` | Lock → care-voice invitation (warms 5 gate screens) | P0 |
| `apps/mobile/app/(tabs)/index.tsx` | Free card = presence-first; paid card = relationship line | P0 |
| `apps/mobile/components/CareLadder.tsx` | **NEW** vertical care-ladder visual | P1 |
| `apps/mobile/app/pricing.tsx` | Ladder header, promise per card, copy reframe, celebration relationship framing | P1 |
| `apps/mobile/app/membership.tsx` | Lead with promise; reframe upsell + "what you've unlocked" | P1 |
| `apps/mobile/components/UpgradeNudgeDialog.tsx` | Source emphasis from SoT (voice already correct) | P2 |
| `apps/mobile/app/coaching.tsx` | Human-led promise voice on gate | P2 |
| `apps/mobile/app/onboarding/index.tsx` | Free presence seed line | P2 |

**Blast radius:** 1 new presentational component + 1 metadata file + copy/UX edits across ~7 files. No data-model, API, auth, schema, or pricing changes. No new dependencies. AI limits untouched (server-enforced parity preserved).

---

## Verification & acceptance

**Manual (primary — UX/voice work):**
1. Free dashboard reads support-first ("we see you" presence), with a gentle, dismissible invitation — not a hard sell.
2. Hitting any locked feature (AI strategy/script, credit repair, coaching) shows the tier's *promise* + the help it brings, no cold "not available" framing.
3. Pricing screen leads with the Care Ladder; each plan leads with its promise, features beneath; copy is invitational and "change anytime."
4. Upgrading triggers a relationship celebration ("Welcome to {Tier} — {promise}").
5. Membership hub leads with the member's promise/presence; next-tier upsell leads with the next promise.
6. Voice is consistent with the dashboard-celebrate plan: warm, "we/you," never commanding.
7. Gold/Platinum surfaces show the human (Marc) so "we do it with you" feels real.

**Automated:**
- `tsc` / typecheck clean; lint clean (no unused styles/imports).
- Existing tests pass (`lib/*.test.ts`); this is copy + presentation, no calculation/limit changes. Keep `AI_DAILY_LIMITS` in sync with the server (`supabase/functions/_shared/subscriptions.ts`) — unchanged here.
- `vc-tester` (diff-aware) after implementation.

**Definition of done:**
- Every tier surface leads with care (a promise), substantiated by features — sourced from one place.
- Free feels *seen and supported*, not only upsold.
- The escalation of help is visible as one Care Ladder.
- Upgrade = a celebrated deepening of help.
- No tier contents/prices changed (unless Workstream E is approved); types/lint/tests green.

---

## Suggested execution order

1. A1 voice SoT (`tierBenefits.ts`) → 2. B1 `UpgradePrompt` reframe (warms 5 screens at once) → 3. C1 dashboard cards (coordinate with dashboard-celebrate plan) → 4. C2 `CareLadder` component → 5. C3/C4 pricing + membership reframe → 6. B3 upgrade celebration → 7. B2 nudge SoT wiring → 8. D1/D2 human face + onboarding seed → 9. typecheck/lint/`vc-tester` → 10. manual voice/UX pass on simulator.

---

## Resume handoff

- **State:** Plan written, not started. Decision flag open: voice/UX reframe only (assumed) vs. also restructuring tier contents (Workstream E).
- **Next action:** Confirm scope + copy for the four `promise`/`careLine`/`presence` lines, then EXECUTE starting A1.
- **Critical preserve points:** `UpgradeNudgeDialog` cadence/eligibility logic; `AI_DAILY_LIMITS` ↔ server parity; RevenueCat purchase/restore/manage flows in `pricing.tsx`/`membership.tsx`; the `m16_ready` effect and `ProgramSnapshotHero` ordering in `index.tsx` (shared with the dashboard-celebrate plan).
- **Sibling plan:** `process/general-plans/active/2026-06-12-dashboard-whole-program-celebrate.md` — same two goals; keep one voice and coordinate edits to `index.tsx` and `onboarding/complete.tsx`.
</content>
</invoke>
