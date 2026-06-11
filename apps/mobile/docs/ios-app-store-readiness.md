# iOS App Store Readiness

This checklist tracks repo-side and account-side work for the first iOS App Store submission.
The Android package remains configured, but Android submission is intentionally out of scope.

## Release Inputs

- Apple Developer account with access to App Store Connect.
- App Store Connect app record for `com.slice.debtresolution`.
- Expo/EAS account access for this project.
- RevenueCat project access.
- Supabase production project access.
- Final legal values for Privacy Policy and Terms.
- Public support email, `https://slicemydebt.com`, and `https://slicemydebt.com/privacy-policy`.
- App Review demo account with test data.

## EAS Builds

Run these commands from `apps/mobile`:

```bash
eas build --platform ios --profile preview
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

Required public mobile variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` or `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` or `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- `EXPO_PUBLIC_APP_ORIGIN`

Required EAS/App Store submission values:

- `EXPO_APPLE_ID`
- `ASC_APP_ID`
- `APPLE_TEAM_ID`
- `EAS_PROJECT_ID`

## RevenueCat and App Store Products

Create or verify monthly auto-renewable subscriptions in App Store Connect and RevenueCat:

- `silver_monthly`
- `gold_monthly`
- `platinum_monthly`

RevenueCat entitlements must contain the tier names `silver`, `gold`, and `platinum`; backend
sync maps active entitlement identifiers by tier substring.

Required Supabase secrets:

- `REVENUECAT_API_KEY`
- `REVENUECAT_WEBHOOK_SECRET`

Validation:

- Sandbox purchase upgrades the Supabase profile tier.
- Restore purchases refreshes the profile tier.
- Cancel/expire simulation downgrades access after entitlement sync.
- RevenueCat webhook updates the same user as app-side sync.

## App Review QA

- Privacy Policy is reachable from Profile, More, and Legal screens.
- Account deletion is reachable from Profile and deletes the authenticated Supabase user.
- Legal placeholders are replaced before submission.
- In-app subscription prices match App Store Connect products.
- Demo credentials and paid-feature review instructions are included in App Review notes.
- Screenshots represent the real app, not the Replit/static web shell.

## Local Verification

```bash
pnpm --filter @workspace/slice typecheck
pnpm --filter @workspace/slice test
pnpm --filter @workspace/api-zod run typecheck
pnpm --filter @workspace/db run typecheck
pnpm --filter @workspace/api-server run typecheck
```

If Supabase CLI is configured locally:

```bash
supabase db lint
supabase test db
```
