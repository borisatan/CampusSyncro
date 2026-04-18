# App Store Submission Checklist — Monelo

## 1. Code Cleanup
- [ ] Commit all pending changes — ~30 modified/untracked files are floating (NetworkContext, OfflineBanner, OfflineEmptyState, EditTransactionModal, etc.)
- [ ] Audit `console.log` statements — strip debug logging from all recently modified files
- [ ] Verify the "skip dev" flag is properly gated or absent in production builds

---

## 2. app.json
- [ ] **Slug mismatch** — app name is `"Monelo"` but slug is `"perfin"`. The slug is **permanent** after first publish — confirm this is intentional
- [ ] **iOS Privacy Strings** — add `infoPlist` to the `ios` section. At minimum, if you use Face ID / biometric lock: `NSFaceIDUsageDescription`. Apple will reject without these.
- [ ] **App icon** — `adaptive-icon.png` is the iOS icon. Requires **1024×1024 PNG, no alpha channel**. Verify it.
- [ ] **`supportsTablet: true` is set** — make sure the UI is acceptable on iPad (Apple tests this)

---

## 3. EAS Build & Credentials
- [ ] Run `eas build --platform ios --profile production` and test the build on a real device
- [ ] Confirm Apple Distribution Certificate + Provisioning Profile are valid in EAS
- [ ] **Fill in `eas.json` submit section** — currently empty `{}`. Add your ASC App ID / Apple ID before running `eas submit`

---

## 4. Apple Developer Portal — Capabilities
- [ ] **Sign In with Apple** — `expo-apple-authentication` is plugged in; enable this capability on your App ID
- [ ] **In-App Purchases** — RevenueCat/SubscriptionProvider is wired in; enable IAP capability
- [ ] **Push Notifications** — `NotificationInitializer` is in the root layout; enable + add APNs key to EAS

---

## 5. RevenueCat / Subscriptions
- [ ] Subscription products created and in **"Ready to Submit"** state in App Store Connect
- [ ] Full purchase + restore flow tested with a sandbox Apple ID
- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_KEY` added to EAS Secrets (not just local `.env`)

---

## 6. EAS Environment Variables
All of these need to be in **EAS Secrets**, not just local `.env`:
- [ ] `EXPO_PUBLIC_SUPABASE_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- [ ] `EXPO_PUBLIC_POSTHOG_API_KEY`
- [ ] `EXPO_PUBLIC_POSTHOG_HOST`

---

## 7. App Store Connect Listing
- [ ] **Screenshots** — App Store requires specific sizes. Assets in `assets/screenshots/` need to match: 6.9" (1320×2868), 6.5" (1242×2688), and 12.9" iPad (2048×2732) if supporting tablet
- [ ] App description, keywords (100 char max), category (Finance)
- [ ] Age rating questionnaire completed
- [ ] **Privacy Policy URL** — required since you collect email (auth) + financial data + PostHog analytics
- [ ] Support URL
- [ ] Pricing configured

---

## 8. Privacy / Legal
- [ ] **Privacy Policy** — must be a live, publicly accessible URL before submission
- [ ] **App Privacy Nutrition Label** in ASC — declare what data is collected (email, financial data, usage analytics)
- [ ] **Supabase RLS** — confirm Row Level Security is enabled on all user data tables

---

## 9. Final Smoke Test on Production Build
- [ ] Sign up → verify email → onboarding → main app
- [ ] Add transaction, view dashboard, budgets, accounts
- [ ] App lock / biometrics
- [ ] Offline banner appears when disconnected
- [ ] OAuth deep link (`perfin://`) works correctly
- [ ] No crash on cold start

---

## Hard Blockers (will cause rejection)
1. Missing `infoPlist` privacy strings if any permission APIs are called
2. App icon has alpha channel
3. Subscription products not set up in ASC
4. Missing Privacy Policy URL
5. Sign In with Apple capability not enabled in App ID
