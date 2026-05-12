# Apple App Store Resubmission Checklist

Submission ID: d7a2a515-7361-4b78-9a8c-0edf6bc168f8  
Reviewed: May 11, 2026 on iPad Air 11-inch (M3)

---

## Issue 1 — Guideline 5.1.1(v): App requires login to use non-account features

Apple wants users to be able to explore the app without creating an account.

### You do yourself
- [ ] Decide what "guest" experience looks like (read-only demo data? empty state with sample transactions?)

### Claude can help
- [ ] Add a "Continue as Guest" / "Explore the app" button to the onboarding/auth screens
- [ ] Gate only account-specific actions (syncing, saving data) behind login — let guests view UI freely
- [ ] Show a prompt to sign up when a guest tries to take a data-writing action

---

## Issue 2 — Guideline 2.3.2: Promotional image for IAP is the same as the app icon

### You do yourself
- [ ] Option A (easier): Delete the promotional image for your IAPs in App Store Connect (App Store Connect → Your App → In-App Purchases → select each plan → remove promotional image)
- [ ] Option B: Design a unique promotional image (1024×1024px) per plan that visually represents what the subscription offers, and upload it in App Store Connect

---

## Issue 3 — Guideline 2.1(b): Apple can't find the In-App Purchases in the app

Apple reviewed but couldn't locate where to buy Premium Yearly / Weekly / Monthly.

### You do yourself
- [ ] Confirm your IAP product IDs are correctly configured in App Store Connect and set to "Ready to Submit"
- [ ] Accept the Paid Apps Agreement in App Store Connect → Business section (required for paid IAPs to work in sandbox)
- [ ] Test all three plans in the Apple sandbox environment using a sandbox Apple ID
- [ ] Reply to Apple's message in App Store Connect with step-by-step instructions for finding the paywall (e.g. "Open app → tap X → tap Upgrade → plans appear")

### Claude can help
- [ ] Make the subscription/paywall screen reachable from a clearly visible entry point in the app (e.g. a persistent "Upgrade" button in settings or on a locked feature), so reviewers can find it without needing an account

---

## Issue 4 — Guideline 3.1.2(c): Missing required subscription disclosure info

The paywall screen and App Store metadata must include specific legal disclosures.

### In-app (on the paywall/subscription screen)
#### Claude can help
- [ ] Display the title of each subscription plan (e.g. "Monelo Premium — Monthly")
- [ ] Display the subscription length and what's included (e.g. "Billed monthly, cancel anytime — includes all premium features")
- [ ] Display the price per plan (fetched from StoreKit so it's locale-correct)
- [ ] Add a tappable link to your Privacy Policy
- [ ] Add a tappable link to your Terms of Use / EULA

### App Store metadata (you do yourself in App Store Connect)
- [ ] Add a link to your Terms of Use (EULA) in the App Description field, or upload a custom EULA in the EULA field
- [ ] Confirm your Privacy Policy URL is filled in under App Store Connect → App Privacy

### You do yourself (if you don't have ToS/Privacy Policy yet)
- [ ] Create or obtain a Terms of Use / EULA document and host it at a public URL
- [ ] Create or obtain a Privacy Policy document and host it at a public URL (required separately)

---

## Final Steps Before Resubmitting

### You do yourself
- [ ] Record a short screen recording showing: the guest mode, the paywall with all disclosures, and how to reach the IAP screen
- [ ] Attach the recording + step-by-step navigation notes in your reply to Apple's message in App Store Connect
- [ ] Add those navigation notes to the "App Review Information → Notes" field for the new submission
- [ ] Submit the new build

### Claude can help
- [ ] Review the updated paywall and onboarding code before submission
