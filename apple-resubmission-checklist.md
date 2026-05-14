# Apple App Store Resubmission Checklist

Submission ID: d7a2a515-7361-4b78-9a8c-0edf6bc168f8  
Reviewed: May 11, 2026 on iPad Air 11-inch (M3)

---

## Code Status — All Done ✅

All in-app changes have been shipped:

- **Guest mode** — "Continue as Guest" on sign-in screen, `GuestWritePrompt` modal blocks write actions and prompts sign-up, guest profile screen explains limitations
- **Paywall findability** — non-subscribed real users are automatically redirected to the subscription screen on login (`(tabs)/_layout.tsx`); "Test Paywall" button also visible in Profile → Developer section
- **Subscription disclosures** — paywall shows plan labels (Yearly/Monthly/Weekly), StoreKit locale-correct prices, billing period subtitles, 7-day free trial callout, "Cancel anytime", tappable Terms of Use + Privacy Policy links

---

## What You Still Need to Do (Manual — Browser Only)

### App Store Connect — IAP Promotional Images (Issue 2)

- [ ] Go to **App Store Connect → Your App → In-App Purchases**, select each plan, and either:
  - **Option A (easiest):** Delete the promotional image entirely
  - **Option B:** Upload a unique 1024×1024px promotional image per plan

---

### App Store Connect — IAP Configuration (Issue 3)

- [ ] Confirm all three IAP product IDs (Weekly / Monthly / Yearly) are set to **"Ready to Submit"**
- [ ] Accept the **Paid Apps Agreement** under App Store Connect → Business (required for sandbox purchases to work)
- [ ] Test all three plans in the **Apple sandbox environment** using a sandbox Apple ID
- [ ] **Reply to Apple's rejection message** in App Store Connect with step-by-step navigation instructions, e.g.:
  > "Open the app → tap 'Sign Up' → complete onboarding → the subscription screen appears automatically before the main dashboard. Alternatively, sign in with a new account that has no active subscription."

---

### App Store Connect — Metadata (Issue 4)

- [ ] Upload a custom **EULA** (Terms of Use) in App Store Connect → Your App → App Information → License Agreement field, OR add the URL (`https://trymonelo.app/terms-and-conditions`) in the App Description
- [ ] Confirm **Privacy Policy URL** (`https://trymonelo.app/privacy-policy`) is filled in under App Store Connect → App Privacy

---

### Final Submission Steps

- [ ] Record a short screen recording showing: guest mode in action, the paywall with all disclosures visible, and how a new user reaches the subscription screen
- [ ] Attach the recording + navigation notes to your **reply to Apple's message** in App Store Connect
- [ ] Paste the navigation steps into **App Review Information → Notes** on the new submission
- [ ] Upload the new build and **submit**
