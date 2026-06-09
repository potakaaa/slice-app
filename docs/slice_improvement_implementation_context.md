# SLICE Improvement Implementation Context

## Purpose

This document gives the implementation context for improving **SLICE**, a debt resolution app with the tagline:

> Reducing your debt one bite at a time.

The goal is to improve SLICE based on market research from budgeting and debt payoff apps. The biggest product lesson is simple: users should not open SLICE and see a complicated debt dashboard first. They should immediately see one emotionally clear next step.

SLICE should feel like:

> A settlement-readiness planner + debt settlement calculator + AI negotiation assistant + coaching workflow.

It should not feel like accounting software.

---

## Core Product Direction

SLICE should answer these questions as fast as possible:

1. **Am I ready to make a debt settlement offer?**
2. **If not, how many days until I am ready?**
3. **How much should I save daily, weekly, or monthly?**
4. **Which creditor should I approach first?**
5. **What should I say when I contact them?**

The app should lead with a clear outcome like:

```text
Settlement-ready in 47 days
Save $18/day to reach your first offer fund.
Next best move: Prepare a hardship script for Capital One.
```

This should be the main user experience improvement.

---

## Product Principles

### KISS Principles

Keep the product simple.

- Do not show too many financial numbers on the first screen.
- Do not force users to connect a bank account.
- Do not require perfect financial data before showing a useful plan.
- Do not use confusing terms like “recurring funding.”
- Do not make the app feel like a spreadsheet.
- Always show the next useful action.
- Use plain English.

Good terms:

- Settlement-ready
- First offer target
- Settlement fund
- Save this much
- Next best move
- Available this month
- Call result
- Follow-up date

Avoid terms:

- Recurring funding
- Debt waterfall
- Liability optimization
- Account reconciliation
- Cashflow architecture
- Financial engine output

---

## SMART Goals

### Specific

Improve SLICE by adding a settlement-readiness experience that shows users when they can make a realistic settlement offer, how much they need to save, and what next action to take.

### Measurable

Track these product metrics:

- Onboarding completion rate
- Time to first useful plan
- Percentage of users who add at least one creditor
- Percentage of users who view the settlement-ready card
- Percentage of users who use the what-if simulator
- Percentage of users who generate or copy a negotiation script
- Percentage of users who log a creditor call result
- Free-to-paid conversion after using AI negotiation tools

### Achievable

Build the improvement in phases. Start with manual entry, a basic settlement calculation engine, a redesigned home screen, and simple creditor tracking. Avoid complex bank integrations for now.

### Relevant

These improvements directly support SLICE’s purpose: helping users organize creditors, calculate settlement targets, build savings plans, generate negotiation scripts, and get coaching guidance.

### Time-bound

Suggested implementation order:

- **Sprint 1:** Settlement engine and core calculations
- **Sprint 2:** Outcome-first home screen redesign
- **Sprint 3:** Manual onboarding improvement
- **Sprint 4:** What-if simulator
- **Sprint 5:** Creditor detail page and script history
- **Sprint 6:** Subscription/paywall layer for advanced features

---

## MVP Scope

The first implementation should focus on the minimum emotionally complete loop:

1. User enters one or more creditors.
2. User enters balance, minimum payment, current saved cash, and monthly set-aside.
3. SLICE calculates a first offer target.
4. SLICE shows when the user is settlement-ready.
5. SLICE recommends the next best move.
6. User can test a what-if scenario.
7. User can generate or save a negotiation script.
8. User can log a creditor response.

---

## Non-Goals for Now

Do not build these yet unless they already exist and only need light integration:

- Bank account linking
- Plaid integration
- Salt Edge integration
- Full budgeting system
- Complex expense categorization
- Credit score monitoring
- Legal document automation
- Automated creditor communication
- Full case management dashboard
- AI decision-making without user confirmation

SLICE can add advanced integrations later, but the first priority is a clean manual-first workflow.

---

# Feature Requirements

## 1. Outcome-First Home Screen

### Goal

The home screen should make the user feel calm and guided. The first thing they see should be their settlement-readiness status.

### Required UI

Create a hero card at the top of the home screen.

Example states:

```text
Settlement-ready now
You have enough saved to make your first offer.
Next best move: Generate your Capital One script.
```

```text
Settlement-ready in 47 days
Save $18/day to reach your first offer fund.
Next best move: Add your next creditor balance.
```

```text
Almost ready
You need $245 more to reach your first offer target.
Next best move: Try the what-if simulator.
```

### Required Card Content

The card should include:

- Settlement status
- Days until first offer readiness
- Current saved amount
- First offer target amount
- Daily savings target
- Weekly savings target
- Next best move
- Buttons:
  - Compare strategies
  - What if?
  - Generate script

### Acceptance Criteria

- The home screen clearly shows one primary outcome.
- The user can understand their status within 5 seconds.
- The home screen does not start with a dense list of debts.
- The app never shows blank or confusing calculation states.
- If data is missing, show a friendly prompt like “Add one creditor to see your first settlement plan.”

---

## 2. Settlement Calculation Engine

### Goal

Create a simple calculation model that estimates when the user is ready to make a settlement offer.

### Required Inputs

At minimum:

- Creditor name
- Current balance
- Monthly minimum payment
- Current amount saved for settlement
- Monthly amount user can set aside
- Target settlement percentage

Optional inputs:

- Due date
- Interest rate
- Account status
- Hardship status
- Notes
- Estimated program/coaching fees
- Emergency buffer amount

### Default Values

Use editable defaults:

- Target settlement percentage: `30%`
- Monthly set-aside: user-provided
- Emergency buffer: optional, default `0`
- Fee estimate: optional, default `0`

### Example Formula

```text
first_offer_target = creditor_balance * target_settlement_percentage
remaining_needed = max(0, first_offer_target + estimated_fees + emergency_buffer - current_saved_cash)
daily_set_aside = monthly_set_aside / 30.44
weekly_set_aside = monthly_set_aside / 4.33
days_until_ready = ceil(remaining_needed / daily_set_aside)
```

### Important Rules

- If monthly set-aside is missing or zero, ask the user to enter what they can save monthly.
- If current saved cash is already greater than or equal to the first offer target, show “Settlement-ready now.”
- If there are multiple creditors, calculate the best first creditor to approach based on the selected strategy.
- Calculations should be presented as estimates, not guarantees.

### Compliance Copy

Include small copy where appropriate:

> Estimates are for planning only and do not guarantee creditor acceptance.

---

## 3. Manual-First Onboarding

### Goal

Let users get a useful plan quickly without linking accounts.

### Recommended Flow

Step 1: Welcome

```text
Let’s build your first settlement plan.
No bank connection required.
```

Step 2: Add first creditor

Fields:

- Creditor name
- Current balance
- Minimum payment

Step 3: Add settlement fund info

Fields:

- How much have you saved so far?
- How much can you set aside each month?

Step 4: Show first plan immediately

```text
You may be settlement-ready in 47 days.
Save around $18/day to reach your first offer target.
```

### Acceptance Criteria

- User can complete onboarding with only one creditor.
- User does not need to connect a bank account.
- User sees a settlement-readiness result immediately after the minimum required fields.
- App copy should feel hopeful, not judgmental.

---

## 4. What-If Simulator

### Goal

Let users quickly test how changing their monthly set-aside affects their settlement readiness.

### UI

Use a simple slider or numeric input.

Example:

```text
What if I change my monthly set-aside?
Current: $400/month
New: $550/month
First offer: 47 days → 31 days
```

### Required Outputs

When the user changes the amount, recalculate:

- New days until settlement-ready
- New daily savings target
- New weekly savings target
- New first offer date estimate
- Best creditor to approach first

### Actions

Buttons:

- Use this plan
- Reset
- Save scenario

### Acceptance Criteria

- The simulator updates instantly.
- The user can commit the new amount to their actual plan.
- The app clearly shows the before and after difference.

---

## 5. Strategy Comparison

### Goal

Give users control over how aggressive or conservative their settlement plan should be.

### Required Strategies

Create three strategy cards:

#### Fastest Settlement

For users who want to make the first offer as quickly as possible.

Show:

- Estimated first offer date
- Required monthly set-aside
- Highest cash pressure warning if applicable

#### Lowest Monthly Strain

For users who need a slower, safer plan.

Show:

- Lower monthly set-aside
- Longer timeline
- More realistic for tight budgets

#### Lowest Cash-Out Risk

For users who want a balanced plan.

Show:

- Safer timeline
- Preserves buffer
- Avoids using all available cash

### Acceptance Criteria

- The user can compare plans side-by-side.
- The selected strategy updates the home hero card.
- Strategy descriptions are written in plain English.
- Do not overcomplicate with too many options.

---

## 6. Creditor Detail Page

### Goal

Each creditor should have a useful action page, not just static debt information.

### Required Sections

1. Creditor summary
2. Settlement target
3. Progress toward offer fund
4. Last contact result
5. Next action
6. Script history
7. Notes

### Example Layout

```text
Capital One
Balance: $6,000
First offer target: $1,800
Status: Almost ready

Next best move:
Generate a hardship settlement script.

Script history:
Jun 07 — Hardship script v2
Outcome: Agent requested callback next week
Notes: Mentioned reduced income
```

### Required Actions

- Generate script
- Copy script
- Log call result
- Add note
- Set follow-up date
- Mark offer accepted
- Mark offer rejected

---

## 7. AI Negotiation Script History

### Goal

Make SLICE more than a debt tracker by helping users prepare for creditor conversations.

### Required Script Types

- Hardship explanation script
- First settlement offer script
- Follow-up script
- Supervisor escalation script
- Payment confirmation script
- Rejection response script

### Script Requirements

Scripts should:

- Be respectful
- Be short enough to read during a call
- Avoid legal guarantees
- Avoid pretending to be an attorney
- Avoid making promises the user cannot keep
- Include editable user-specific details

### Example Script

```text
Hi, I’m calling about my account with Capital One. I’m currently experiencing financial hardship and I’m trying to resolve this responsibly. I’m not able to continue with the full balance, but I may be able to offer a lump-sum settlement. Is there someone I can speak with about hardship or settlement options?
```

### Required Fields for Saved Script History

- Creditor ID
- Script type
- Script content
- Date created
- Date used
- Outcome
- Notes
- Next follow-up date

---

## 8. Daily or Weekly Check-In

### Goal

Keep users engaged with small, low-stress progress updates.

### Check-In Copy Examples

```text
Did anything change today?
```

```text
Log a creditor call or update your settlement fund.
```

```text
You are 5 days closer to your first offer.
```

### Required Quick Actions

- Add money to settlement fund
- Log creditor call
- Update monthly set-aside
- Generate next script
- Skip today

### Acceptance Criteria

- Check-ins should feel helpful, not nagging.
- Users should be able to skip without guilt-based copy.
- Check-ins should reinforce progress.

---

## 9. Subscription and Paywall Logic

### Goal

Keep the free version useful while making paid features valuable.

### Free Features

- Manual creditor entry
- Basic settlement-readiness calculation
- Basic home hero card
- Current saved amount tracking
- One basic negotiation script
- Basic progress view

### Paid Features

- Unlimited AI negotiation scripts
- Script history
- Strategy comparison
- What-if simulator saved scenarios
- Creditor call log history
- PDF export
- Secure cloud sync
- Shared plan access
- Coaching booking integration

### Paywall Rule

Do not block the user from seeing their first settlement plan. The paywall should appear only after the user experiences core value.

Good paywall trigger examples:

- User tries to generate multiple scripts
- User tries to save script history
- User tries to compare strategies
- User tries to export a plan
- User tries to share with coach/spouse/co-signer

---

# Data Model Suggestions

Use the existing backend if already available. If Supabase is being used, keep secrets on the backend and never expose service role keys in the frontend.

## creditors

Suggested fields:

- id
- user_id
- name
- balance
- minimum_payment
- due_date
- account_status
- hardship_status
- target_settlement_percentage
- target_settlement_amount
- notes
- created_at
- updated_at

## settlement_plans

Suggested fields:

- id
- user_id
- current_saved_cash
- monthly_set_aside
- daily_set_aside
- weekly_set_aside
- first_offer_target
- remaining_needed
- estimated_days_until_ready
- selected_strategy
- emergency_buffer
- estimated_fees
- created_at
- updated_at

## negotiation_scripts

Suggested fields:

- id
- user_id
- creditor_id
- script_type
- script_content
- created_at
- used_at
- outcome
- notes
- next_follow_up_date

## creditor_contact_logs

Suggested fields:

- id
- user_id
- creditor_id
- contact_date
- contact_method
- person_spoken_to
- outcome
- amount_offered
- amount_requested_by_creditor
- follow_up_date
- notes
- created_at

## check_ins

Suggested fields:

- id
- user_id
- check_in_date
- action_taken
- amount_added_to_settlement_fund
- creditor_id
- notes
- created_at

## subscriptions

Suggested fields:

- id
- user_id
- provider
- provider_customer_id
- provider_subscription_id
- status
- plan_name
- renews_at
- created_at
- updated_at

---

# UX Writing Guidelines

## Voice

SLICE should sound:

- Calm
- Encouraging
- Simple
- Trustworthy
- Practical
- Non-judgmental

## Good Copy Examples

```text
You’re closer than you think.
```

```text
Let’s build your first settlement plan.
```

```text
No bank connection required.
```

```text
You may be ready to make your first offer in 47 days.
```

```text
Try saving $50 more per month to move faster.
```

```text
Prepare your next call script.
```

## Avoid Copy Like

```text
You failed to save enough.
```

```text
Your debt situation is poor.
```

```text
You must connect your bank to continue.
```

```text
Financial optimization strategy required.
```

---

# UI Design Direction

SLICE should stay visually consistent with the existing brand:

- Bright orange accents
- White background
- Dark navy or black text
- Rounded cards
- Bold CTAs
- Friendly, hopeful tone
- Clean spacing
- Orange slice visual identity

## Home Screen Layout

Recommended order:

1. Header with SLICE logo/name
2. Settlement-readiness hero card
3. Next best move card
4. What-if simulator preview
5. Creditor progress list
6. Recent activity or script history

Do not start with:

- A dense financial dashboard
- A full list of all debts
- A chart-heavy analytics page
- Account connection prompts

---

# Implementation Acceptance Criteria

The improvement is complete when:

- A new user can add one creditor and see a settlement-readiness result.
- The home screen shows a clear hero outcome card.
- The app calculates daily and weekly savings targets.
- The user can test a what-if scenario.
- The user can generate or view a negotiation script.
- The user can log a creditor contact result.
- The app uses manual entry by default.
- The app does not require bank linking.
- The app avoids confusing terms.
- The app clearly states that estimates are not guarantees.
- No secret API keys are exposed in the frontend.

---

# Suggested Developer Task Breakdown

## Task 1: Audit Current App

Before changing anything, inspect the existing SLICE codebase and identify:

- Current home screen structure
- Existing debt/creditor data models
- Existing onboarding flow
- Existing Supabase tables
- Existing AI script generation flow
- Existing subscription or RevenueCat integration

Do not duplicate existing features. Improve what already exists when possible.

## Task 2: Add or Update Calculation Utilities

Create reusable functions for:

- First offer target
- Remaining needed
- Daily set-aside
- Weekly set-aside
- Days until settlement-ready
- Strategy comparison

Keep these calculations separate from UI components.

## Task 3: Redesign Home Screen

Add the settlement-readiness hero card and next-best-move section.

## Task 4: Improve Onboarding

Make the first creditor and settlement fund setup short and manual-first.

## Task 5: Add What-If Simulator

Add a simple slider or input that recalculates the timeline instantly.

## Task 6: Add Creditor Action Page

Add or improve creditor detail pages with script history and call logging.

## Task 7: Add Paywall Rules

Only paywall advanced features after the user sees their first useful result.

## Task 8: Test End-to-End

Test these user flows:

- New user creates first plan
- Existing user updates monthly set-aside
- User generates a script
- User logs creditor response
- User compares strategies
- User reaches settlement-ready state

---

# Safety, Privacy, and Legal Notes

SLICE should not claim that it can guarantee a settlement.

Use language like:

- “Estimate”
- “Likely”
- “Planning only”
- “May help”
- “Suggested next step”

Avoid language like:

- “Guaranteed settlement”
- “We will reduce your debt”
- “Creditors will accept this offer”
- “Legal advice”

Add disclaimer where appropriate:

> SLICE provides planning tools and suggested scripts. It does not guarantee debt settlement outcomes and does not provide legal advice.

---

# Final Instruction for the AI Builder

Implement the improvement in the simplest working version first. Prioritize the core user loop over advanced integrations.

The highest priority is:

> Add a settlement-readiness experience that tells the user when they can make their first offer, how much to save, and what to do next.

Do not overbuild. Do not add bank linking yet. Do not create a complex budgeting system. Keep the experience simple, measurable, useful, and emotionally clear.
