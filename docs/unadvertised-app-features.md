# Features the App Has That the Website Doesn't Advertise

> Compares the live app implementation (`apps/mobile/`) against the marketing site
> at https://slice-web.netlify.app/ (Free / Silver / Gold / Platinum feature lists).
> Last checked: 2026-06-10. Only **implemented** features are listed here —
> placeholders and unwired backends are noted separately at the bottom.

## Summary

The website undersells the app. There are **13 shipped features/capabilities**
that don't appear anywhere in the site's plan tables. Most are in the core
free-tier debt-planning experience, which the site reduces to a short bullet list.

---

## Tools & planners (not on site)

| Feature | What it does | Source |
|---|---|---|
| **What-If Simulator** | Interactive slider showing how changing monthly savings moves your settlement date | `apps/mobile/app/what-if.tsx` |
| **Savings Planner** | Reverse calculator — find the monthly savings amount needed to hit a target timeline | `apps/mobile/app/savings-planner.tsx` |

The site only advertises the **Settlement Calculator** and **Snowball Timeline**.
These two additional planning tools are free and shipped.

---

## Settlement intelligence engine (not on site)

| Feature | What it does | Source |
|---|---|---|
| **Settlement Readiness engine** | Calculates whether you're ready to make a first offer, and if not, *when* you will be. Statuses: `ready`, `almost`, `on_track`, `needs_input`, `empty`. Identifies the priority creditor and first-offer target | `apps/mobile/utils/calculations.ts` (`calcSettlementReadiness`), `apps/mobile/components/SettlementReadinessCard.tsx` |
| **Next Best Move recommendation** | Surfaces the single most useful next action based on readiness state | `apps/mobile/utils/calculations.ts` (`getNextBestMove`) |
| **AI suggested offer** | Computes a recommended settlement offer per creditor from the balance | `apps/mobile/utils/calculations.ts` (`getAISuggestedOffer`) |

This is arguably the app's most differentiated capability and is **completely absent** from the marketing site.

---

## Creditor workflow (not on site)

| Feature | What it does | Source |
|---|---|---|
| **Call / contact logging** | Log each creditor call with an outcome (Left a message, Requested a callback, They counter-offered, Offer accepted, Offer rejected, No answer, Other) plus free-text notes | `apps/mobile/app/creditor/log-call/[id].tsx`, `OUTCOME_LABELS` in `calculations.ts` |
| **Follow-up reminders** | Quick-chip scheduling of a follow-up date (1 week / 2 weeks / 1 month) when logging a call | `getFollowUpDateISO` in `calculations.ts` |
| **Negotiation status workflow** | Per-creditor status tracking: Active → Negotiating → Settled, with auto-detection of program completion | `apps/mobile/app/creditor/[id].tsx` |
| **Settlement fund tracking** | Track current saved cash toward settlements via "Add to Fund" and measure offer progress against it | `apps/mobile/app/add-to-fund.tsx` |

The site mentions "Creditor list & tracking" but none of the negotiation-lifecycle tooling above.

---

## Credit repair (only partially advertised)

The site advertises a **Credit score tracker** (Free). The app ships that, **plus**:

| Feature | What it does | Source |
|---|---|---|
| **Credit Repair Checklist** | Categorized, checkable task list with progress bar. Categories: Report, Dispute, Settlement, Documentation, Monitoring, Planning | `apps/mobile/app/credit-repair.tsx` |

---

## Subscription & AI details (not on site)

| Feature | What it does | Source |
|---|---|---|
| **AI call-script tones (4)** | The site says "customized call scripts" but doesn't mention the 4 selectable tones: Calm, Firm, Hardship, Short & Direct | `apps/mobile/app/ai/script/[id].tsx` |
| **Yearly billing — 20% off (2 months free)** | The site shows monthly pricing only ($19/$49/$99). The app offers annual billing at $15.20/$39.20/$79.20 per month | `apps/mobile/app/pricing.tsx` |
| **AI usage meter** | Per-tool daily request allowance is shown to the user (Silver 30 / Gold 100 / Platinum 250 per tool) | `apps/mobile/lib/tierBenefits.ts`, `AI_USAGE_FEATURES` in `sliceData.ts` |

---

## Platform / account features (not on site)

| Feature | What it does | Source |
|---|---|---|
| **Dark mode** | Automatic light/dark theming following the system color scheme | `apps/mobile/hooks/useColors.ts` |
| **Account management** | Edit name/email, sign out, and full account deletion | `apps/mobile/app/profile.tsx` |

---

## Not included here (and why)

These appear in code but are **not** shipped features, so they're excluded from the list above:

- **AI Dispute Letter Generator** — explicitly a placeholder in the UI ("Available in a future…"). `credit-repair.tsx`
- **Zest AI Debt Coach** — advertised on the site (Silver+) and has a backend (`supabase/functions/zest-chat/`) + API method (`sendZestMessage`), but **no front-end UI exists** to use it. This is a site-vs-app gap in the *opposite* direction (advertised but unusable), tracked separately.
