# SLICE App Builder Long Prompt

Build a clean, mobile-first **Expo React Native app** called **SLICE** for **iOS and Android**. SLICE is a DIY debt resolution app with the tagline **“Reducing your debt one bite at a time.”** The brand should use a white-and-orange visual identity with an orange slice logo that has a bite taken out of it. The app helps users create a customized debt settlement program, track creditors, calculate settlement targets, plan monthly savings, and get AI-powered negotiation guidance so they can reduce debt without paying traditional debt settlement companies around 25% of their debt amount.

Keep the build simple and practical for an MVP. Use **Expo Router**, **TypeScript**, **Zustand with local persistence**, reusable components, mock data, and a clean file structure. Prepare the architecture for **Supabase**, **RevenueCat / StoreKit subscriptions**, and a secure backend proxy for Claude or another AI API, but do not overcomplicate the first version. The first version should work locally with mock data and be easy to extend later.

---

## Core App Goal

SLICE should help each user build a **customized debt program** during onboarding.

The onboarding should collect:

- Total debt amount
- Individual creditor names
- Creditor phone numbers
- Amount owed per creditor
- User’s target settlement percentage
- User’s monthly savings amount
- Current credit score
- Main goal: settle debt, repair credit, prepare for creditor calls, or build a payoff plan

After onboarding, the app should automatically calculate:

- Estimated settled amount
- Settlement target based on percentage
- Monthly savings progress
- Number of months needed to save the settlement amount
- Estimated length of the debt program
- Suggested priority order from lowest balance to highest balance

Example:

If the user owes **Bank of America $10,000** and selects a **50% settlement target**, the app calculates a suggested settlement amount of **$5,000**. If the user saves **$500/month**, the app shows that it may take about **10 months** to save the settlement amount. If the user chooses 60% or 70%, the timeline should update automatically.

---

## Main MVP Screens

Create these core screens:

1. Welcome / onboarding
2. Customized debt program setup
3. Dashboard
4. Credit score input
5. Creditor list
6. Add/edit creditor
7. Creditor detail page
8. Settlement calculator
9. Monthly savings planner
10. Snowball timeline
11. AI negotiation strategy screen
12. AI customized negotiation script screen
13. Credit repair page
14. Founder coaching booking with Marc Feinberg
15. Subscription/pricing screen
16. Profile/settings
17. Legal disclaimer screen

Use simple cards, progress bars, badges, and clear CTAs. Avoid overwhelming charts or overly complex finance UI.

---

## Customized Debt Program

The app should create a simple table or card-based program for each creditor with four main columns:

1. **Debt Amount** — amount owed to the creditor
2. **Settled Amount** — automatically calculated based on the user’s selected settlement percentage, such as 30%, 40%, 50%, 60%, or 70%
3. **Monthly Savings** — amount the user can save monthly toward that creditor
4. **Program Length** — automatically calculated number of months needed to reach the settlement amount

Formula:

```text
settledAmount = debtAmount * selectedSettlementPercentage
programLengthMonths = settledAmount / monthlySavings
```

Round program length up to the next full month.

The user should be able to adjust the settlement percentage and monthly savings amount, and the app should instantly update the settlement amount and program length.

---

## AI Negotiation Strategy

For each creditor, include an AI-powered negotiation strategy feature.

Example:

If the user owes **Bank of America $10,000**, the AI agent may suggest:

- Start with a lower first offer, such as 30%
- Prepare a hardship explanation
- Ask for written confirmation before paying
- Do not provide unnecessary bank account access
- Ask whether the creditor can mark the account as settled
- Keep records of every call

The AI should generate a **suggested settlement offer** and explain why that offer may be a good starting point.

The AI should not guarantee that a creditor will accept any offer.

---

## AI Customized Negotiation Script

Create an AI customized negotiation script feature.

The script should be generated from:

- Creditor name
- Debt amount
- Target settlement percentage
- User’s monthly savings ability
- User’s selected tone: calm, firm, hardship-based, or short and direct
- User notes

The app should generate scripts for:

- First creditor call
- Settlement offer call
- Follow-up call
- Final confirmation call
- What not to say
- Questions to ask before paying

The script should feel practical and easy to read while the user is on the phone.

This feature can be placed in a premium tier, but for MVP it can be shown as a locked or preview feature.

---

## Credit Repair Page

Add a **Credit Repair** page that helps users understand what to do after or during debt settlement.

The page should include:

- Credit score tracker
- Credit report checklist
- Dispute letter placeholder
- Steps to request written settlement confirmation
- Steps to monitor account status after payment
- Reminder to keep copies of all settlement letters and payment confirmations
- Educational content about rebuilding credit habits
- Disclaimer that SLICE does not guarantee credit score improvement and does not provide legal credit repair services

Potential future feature:

- AI credit dispute letter generator
- Credit bureau dispute tracking
- 1099-C tax document guidance
- Monthly credit improvement checklist

---

## Founder Coaching with Marc Feinberg

Add a premium coaching feature where users can book a direct coaching session with **Marc Feinberg**, one of the founders of SLICE.

The coaching screen should include:

- “Book a Coaching Session with Marc Feinberg” CTA
- Founder profile card
- Short description of Marc as founder, debt coach, author, and financial mentor
- Calendar booking flow
- Session topic selector
- User debt summary pre-fill
- Notes/questions field before booking
- Confirmation screen
- Email or push notification reminders
- Upgrade prompt if locked

Suggested coaching topics:

- Debt settlement strategy
- What to say to creditors
- Reviewing the user’s creditor list
- Understanding settlement timelines
- Budget and savings planning
- Preparing for negotiation calls
- Credit repair guidance
- General debt resolution guidance

Include a disclaimer that coaching is educational guidance only and does not replace legal, tax, credit, or financial advice from a licensed professional.

---

## SMART and KISS Requirements

Use **SMART goals** inside the app:

- **Specific:** each debt has a creditor, balance, phone number, and target settlement
- **Measurable:** each debt tracks balance, settlement amount, monthly savings, and progress
- **Achievable:** timelines are based on the user’s real monthly savings ability
- **Relevant:** debts are prioritized by settlement goals and snowball order
- **Time-bound:** every creditor has a target settlement date and estimated program length

Apply **KISS** principles:

- Keep the MVP simple
- Avoid unnecessary complexity
- Use plain language
- Use clear screens and CTAs
- Use local mock data first
- Build locked placeholders for complex premium features
- Do not overbuild the backend until core flows are working

---

## Tiers and Monetization

Create four pricing tiers:

### Free

Includes:

- Dashboard
- Credit score tracker
- Creditor list
- Basic customized debt program
- Settlement calculator
- Snowball timeline
- Budget/monthly savings tracker
- Credit repair education page

### Silver

Includes:

- Everything in Free
- Zest AI Debt Coach
- AI negotiation strategy
- AI customized negotiation scripts
- Mastermind add-on or preview

### Gold

Includes:

- Everything in Silver
- Mastermind replays
- Coaching options
- Tax advisory booking
- Option to book coaching with Marc Feinberg

### Platinum

Includes:

- Everything in Gold
- Live done-with-you creditor call booking
- Priority coaching
- Priority access to Marc Feinberg founder coaching
- Advanced debt settlement guidance

Use upgrade prompts for locked premium features instead of hiding them.

---

## Technical Requirements

Use:

- Expo SDK
- React Native
- TypeScript
- Expo Router
- Zustand with local persistence
- AsyncStorage
- Reusable components
- Local mock data for MVP
- Prepared Supabase structure for future auth/database
- Prepared RevenueCat / StoreKit structure for subscriptions
- Prepared secure backend proxy for Claude AI
- Clean folder structure
- App Store-ready responsive layouts

Core data models should include:

- UserProfile
- Creditor
- DebtProgram
- SettlementScenario
- MonthlySavingsPlan
- NegotiationScript
- CreditRepairTask
- CoachingBooking
- SubscriptionTier

---

## Legal and Compliance

Include clear disclaimers:

- SLICE is not a law firm
- SLICE does not provide legal advice
- SLICE does not provide tax advice
- SLICE does not provide guaranteed credit repair
- SLICE does not guarantee settlement results
- SLICE does not guarantee credit score improvement
- Users should get all settlement agreements in writing before paying
- Users should consult qualified legal, tax, credit, or financial professionals when needed

Do not promise guaranteed debt settlement or guaranteed credit improvement.

---

## Output Required

Generate a clean MVP with:

- Expo Router navigation
- Complete mobile UI screens
- Reusable design system
- Orange slice branding
- Dashboard
- Customized debt program setup
- Creditor management
- Settlement calculator
- Monthly savings/program length calculator
- Snowball timeline
- AI negotiation strategy placeholder
- AI customized script placeholder
- Credit repair page
- Marc Feinberg coaching booking placeholder
- Pricing/subscription screen
- Profile/settings
- Legal disclaimer screen
- Local mock data
- Clean maintainable code

The app should feel like a real finance product, but the MVP should stay simple, focused, and buildable.
