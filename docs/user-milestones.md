# SLICE — Important User Milestones

> _Reducing your debt one bite at a time._

This document is a thorough review of the SLICE app from the **user's point of view**, and a
sequenced list of the milestones that matter most to them. A "milestone" here is a moment where the
user crosses a meaningful threshold — emotional, financial, or behavioral — that we should celebrate,
measure, and design around.

SLICE is a **debt-settlement readiness app**: a settlement calculator + savings planner + AI
negotiation assistant + coaching workflow. The product's north star is to answer five questions as
fast as possible:

1. Am I ready to make a debt settlement offer?
2. If not, how many days until I am ready?
3. How much should I save daily / weekly / monthly?
4. Which creditor should I approach first?
5. What should I say when I contact them?

---

## App at a glance (what the user actually experiences)

| Area | What the user gets |
|---|---|
| **Onboarding** (`onboarding/`) | 4-step manual-first setup: name + email + monthly savings → add creditors → goal + credit score → "Your Program Is Ready" |
| **Home / "Your Plan"** (`(tabs)/index`) | Outcome-first hero: a **Settlement Readiness** card, demoted program numbers, next-priority creditor, quick actions |
| **Debt Program** (`(tabs)/program`) | Per-creditor settlement target (30–70%) + monthly savings tuning |
| **Tools** (`(tabs)/tools`) | Calculator, What-If Simulator, Savings Planner, Snowball Timeline (free) + AI Strategy & AI Script (paid) |
| **Creditors** (`(tabs)/creditors`, `creditor/[id]`) | Per-creditor detail: status, settlement target, contact log, script history, follow-ups |
| **AI** (`ai/strategy`, `ai/script`) | AI negotiation strategy and call scripts (Silver+) |
| **More** (`(tabs)/more`) | Credit Repair, Coaching with Marc, Membership, Upgrade, Profile, Legal |
| **Monetization** | Free → Silver → Gold → Platinum tiers (RevenueCat), AI gated behind Silver+ |

Design promise: the user should understand their status **within 5 seconds**, never see a blank or
confusing calculation, and always be shown the **next best move**. Estimates are always framed as
planning aids, never guarantees.

---

## The milestone map

Milestones are grouped into five arcs. Each lists **why it matters**, the **trigger in the app**, and
the **signal we can measure**.

### Arc 1 — Activation (get to first value)

**M1. First launch / welcome seen**
- *Why:* The make-or-break first impression. The orange gradient welcome sets the hopeful, non-judgmental tone.
- *Trigger:* `onboarding/index` shown; user taps "Get Started — It's Free."
- *Signal:* Onboarding start rate.

**M2. Settlement fund set up**
- *Why:* Capturing name, email, and a monthly savings amount is the minimum needed to compute a plan.
- *Trigger:* `onboarding/step1` completed.
- *Signal:* Step-1 completion rate.

**M3. First creditor added** ⭐ _Core activation event_
- *Why:* Without one creditor, SLICE can show nothing useful. This is the single highest-leverage activation step.
- *Trigger:* `onboarding/step2` (or `creditor/add`) saves a creditor with a balance.
- *Signal:* % of users who add at least one creditor.

**M4. Goal + credit score chosen**
- *Why:* Personalizes the experience (Settle / Repair / Prepare for calls / Build payoff plan) and gates messaging.
- *Trigger:* `onboarding/step3` completed.
- *Signal:* Goal-selection rate.

**M5. "Your Program Is Ready" — first plan generated** ⭐ _Aha moment_
- *Why:* The emotional payoff of onboarding — the user sees their settlement target and timeline for the first time.
- *Trigger:* `onboarding/complete` renders with a real total target.
- *Signal:* Onboarding completion rate; **time to first useful plan**.

**M6. Account created / plan saved to the cloud**
- *Why:* Converts an anonymous draft into a durable, synced account (auth + email confirmation).
- *Trigger:* `auth` flow completes; `onboardingReadyForAuth` → confirmed.
- *Signal:* Draft-to-account conversion.

### Arc 2 — Comprehension (understand the path)

**M7. Viewed the Settlement Readiness hero card** ⭐
- *Why:* This card _is_ the product. Seeing a clear status — **Ready now / Almost ready / On track / Add input** — is the core "I understand my situation" moment.
- *Trigger:* Home screen renders `SettlementReadinessCard` with `status` of `ready` / `almost` / `on_track`.
- *Signal:* % of users who view the readiness card; status distribution.

**M8. Saw a concrete savings target**
- *Why:* "Save $18/day to reach your first offer" turns a vague worry into a doable action.
- *Trigger:* Readiness card shows daily/weekly set-aside and a `readyDate`.
- *Signal:* % with a non-null ready date (i.e., they entered a monthly set-aside).

**M9. Ran the What-If Simulator**
- *Why:* The user takes control — testing how more (or less) monthly savings moves their settlement date.
- *Trigger:* `what-if` screen interaction.
- *Signal:* % of users who use the what-if simulator.

**M10. Identified the first creditor to approach**
- *Why:* Answers "who first?" via snowball priority — removes decision paralysis.
- *Trigger:* Home "Next Priority" card / `snowball` timeline viewed.
- *Signal:* Snowball/timeline view rate.

### Arc 3 — Action (do the hard things)

**M11. Generated an AI negotiation strategy** ⭐ _First paid-value taste_
- *Why:* This is where SLICE stops being a calculator and becomes a coach. Often the first paywall encounter.
- *Trigger:* `ai/strategy/[id]`.
- *Signal:* % who generate a strategy; free→paid conversion after this.

**M12. Generated / copied a call script** ⭐
- *Why:* The user is now *ready to actually call a creditor* — the riskiest, most valuable real-world action.
- *Trigger:* `ai/script/[id]` generated or copied.
- *Signal:* % of users who generate or copy a negotiation script.

**M13. Logged a creditor call result** ⭐ _Proof of real-world action_
- *Why:* The user picked up the phone and negotiated. This is the strongest signal of genuine engagement and outcome.
- *Trigger:* `creditor/log-call/[id]` saves an outcome.
- *Signal:* % of users who log a call result; outcome breakdown.

**M14. Added money to the settlement fund**
- *Why:* Tangible forward motion toward the first offer — the savings flywheel starts turning.
- *Trigger:* `add-to-fund`.
- *Signal:* Fund contribution rate; total saved over time.

**M15. Set a follow-up date**
- *Why:* Negotiation is a multi-touch process; scheduling the next step keeps momentum alive.
- *Trigger:* Follow-up date saved on a contact log.
- *Signal:* % of active creditors with a future follow-up.

### Arc 4 — Outcomes (the wins)

**M16. Became "Settlement-ready now" for a creditor** ⭐ _Major win_
- *Why:* The user has saved enough to make a real offer. Maximum motivation moment — prime time to celebrate.
- *Trigger:* `calcSettlementReadiness` returns `status: "ready"`.
- *Signal:* % reaching ready state; time-to-ready.

**M17. Settled a creditor** ⭐⭐ _The headline outcome_
- *Why:* The whole reason the app exists. A debt resolved for less than owed. Triggers the in-app celebration.
- *Trigger:* Creditor `status` set to `"settled"` (`creditor/[id]` → "Debt Settled!" celebration, `markMilestoneCelebrated`).
- *Signal:* # creditors settled; total $ saved vs. owed.

**M18. First celebrated "happy moment"**
- *Why:* Drives goodwill that powers a well-timed review ask (Pillar 3: Emotional Connection).
- *Trigger:* `recordHappyMoment()` accumulates; review prompt fires when goodwill is high.
- *Signal:* Happy-moment count; review-prompt acceptance.

**M19. All creditors settled — debt-free** ⭐⭐⭐ _Ultimate milestone_
- *Why:* The user completed the journey. The single most powerful word-of-mouth and testimonial moment.
- *Trigger:* Every creditor in the program reaches `settled`.
- *Signal:* % of cohorts reaching fully-settled.

### Arc 5 — Commitment & monetization

**M20. Hit a value-first paywall**
- *Why:* By design, the paywall appears *only after* core value (first plan, first script attempt) — not before.
- *Trigger:* Free user taps a premium tool → `pricing`.
- *Signal:* Paywall view rate; view-to-purchase.

**M21. Upgraded to Silver** ⭐ _First conversion_
- *Why:* Unlocks unlimited AI strategy/scripts, Zest AI coach, full history (30 AI requests/day per tool).
- *Trigger:* RevenueCat purchase → `tier: "silver"`.
- *Signal:* Free→Silver conversion.

**M22. Upgraded to Gold**
- *Why:* Adds live weekly Zoom coaching + 1-on-1 founder coaching with Marc (100 AI requests/day).
- *Trigger:* `tier: "gold"`.
- *Signal:* Silver→Gold upgrade.

**M23. Upgraded to Platinum**
- *Why:* "We do it with you" — done-with-you creditor calls, priority coaching (250 AI requests/day).
- *Trigger:* `tier: "platinum"`.
- *Signal:* Gold→Platinum upgrade.

**M24. Booked a coaching session**
- *Why:* Highest-touch engagement — a human in the loop dramatically improves outcomes and retention.
- *Trigger:* `coaching` booking submitted (Gold/Platinum).
- *Signal:* Coaching booking rate.

**M25. Left an app-store review**
- *Why:* The compounding growth loop, earned only after real wins.
- *Trigger:* `reviewPrompt` accepted post-happy-moment.
- *Signal:* Prompt→review conversion.

---

## The "minimum emotionally complete loop"

If a user only does these, SLICE has delivered its promise:

1. Add one creditor → **M3**
2. Enter saved cash + monthly set-aside → **M2 / M8**
3. See settlement target + ready date → **M5 / M7**
4. Test a what-if scenario → **M9**
5. Generate a script → **M12**
6. Log a creditor response → **M13**
7. Reach settlement-ready → **M16**
8. Settle a creditor → **M17**

---

## North-star & supporting metrics

**North star:** # of creditors settled (M17) and total dollars saved vs. owed.

**Activation funnel:** M1 → M3 → M5 → M7 (target: minimize time-to-first-plan).

**Engagement funnel:** M9 → M12 → M13 → M14 (real-world action).

**Revenue funnel:** M20 → M21 → M22/M23 → M24.

**Emotional/retention loop:** M16/M17 → M18 → M25.

---

## Design principles these milestones must honor

- **Always show the next best move** — never a dead end or blank state.
- **Plain English** — "Settlement-ready," "First offer target," "Save this much." Avoid jargon like "recurring funding" or "debt waterfall."
- **Hopeful, non-judgmental tone** — "You're closer than you think," never "You failed to save enough."
- **Estimates, not guarantees** — every outcome screen carries the planning-only disclaimer; no legal advice, no guaranteed settlement claims.
- **Value before paywall** — the user must reach M5 and taste M11/M12 before being asked to pay.

---

_Last reviewed: 2026-06-10. Milestones are derived from the current implementation in
`apps/mobile/app/**` and `apps/mobile/lib/**`, and the product direction in
`docs/slice_improvement_implementation_context.md`._
