# Apple App Store Resubmission Checklist

Submission ID: d7a2a515-7361-4b78-9a8c-0edf6bc168f8  
Reviewed: May 15, 2026 on iPad Air 11-inch (M3), iPadOS 26.5

---

## Previous Code Changes — All Done ✅

- **Guest mode** — "Continue as Guest" on sign-in screen, `GuestWritePrompt` modal blocks write actions, guest profile screen explains limitations
- **Paywall findability** — non-subscribed real users auto-redirected to subscription screen on login (`(tabs)/_layout.tsx`)
- **Subscription disclosures** — paywall shows plan labels, StoreKit prices, billing periods, free trial callout, "Cancel anytime", Terms + Privacy links

---

## New Rejection — May 15, 2026

Three issues from the second rejection:

---

### Issue 1 — Guideline 3.1.2(c): Free trial more prominent than billed amount ✅ Fixed

**What Apple wants:** The billed amount must be the most visually prominent pricing element. Free trial info must be subordinate in size and position.

**Code fix in `app/(onboarding)/subscription-trial.tsx`:**

- [x] Increased plan card price text from `text-base` → `text-xl` so it's larger than the trial box's `text-sm` label
- [x] Added "then $X/period after 7-day trial" line directly below the CTA button so the billed amount is visible at the point of purchase

---

### Issue 2 — Guideline 2.3.2: Metadata doesn't disclose paid features

**What Apple wants:** App description and screenshots must clearly note that features require a subscription purchase.

**Manual fix in App Store Connect:**

- [ ] Add a line to the **App Store description** (e.g., at the top or in a "Subscription" section): _"Full access to Monelo requires an active subscription. A 7-day free trial is available."_
- [ ] Review each **screenshot**: if any shows a Premium-only screen (dashboard, analytics, etc.) with no paywall visible, add a subtitle caption or replace it with a screenshot that includes the paywall/subscription prompt
- [ ] Optionally add a **"What's Included"** section to the description listing free vs. paid features

---

### Issue 3 — Guideline 2.1(b): Restore purchases shows "no active subscription found" error ✅ Fixed

**Root cause:** `handleRestore` (and the purchase success handler) were checking `customerInfo.entitlements.active["premium"]` but the RevenueCat entitlement is named `"Monelo Pro"`. This caused every restore attempt to silently fail and show the error — even for users with a valid active subscription.

**Code fix in `app/(onboarding)/subscription-trial.tsx`:**

- [x] Line 145 (purchase flow): `"premium"` → `"Monelo Pro"`
- [x] Line 182 (restore flow): `"premium"` → `"Monelo Pro"`

---

## Manual Steps Before Resubmitting

- [ ] Complete Issue 2 metadata fix in App Store Connect (see above)
- [ ] Confirm all three IAP product IDs (Weekly / Monthly / Yearly) are **"Ready to Submit"** in App Store Connect
- [ ] Confirm the **Paid Apps Agreement** is accepted under App Store Connect → Business
- [ ] Test restore with a sandbox Apple ID that has a prior purchase — should now route to dashboard instead of showing the error

---

## Reply to Apple

Reply to the rejection message in App Store Connect with:

> **Issue 3.1.2(c):** We've increased the billed amount text size in the plan selector cards so it is visually larger than the free trial callout. We also added "then $X/period after 7-day trial" text directly below the purchase button so the billed amount is the most prominent pricing element at the point of purchase.
>
> **Issue 2.3.2:** We have updated the App Store description to clearly state that full access requires an active subscription.
>
> **Issue 2.1(b):** We identified and fixed a bug where the restore flow was checking the wrong RevenueCat entitlement name ("premium" instead of "Monelo Pro"). This caused every restore to return no active subscription even for valid subscribers. The fix has been applied to both the purchase success handler and the restore handler.

---

## Final Submission Steps

- [ ] Build and submit the new version via Xcode / EAS
- [ ] Paste navigation notes in **App Review Information → Notes**: _"Open the app → tap 'Sign Up' → complete onboarding → subscription screen appears automatically. To test restore: sign in with a sandbox account that previously purchased, tap 'Restore Purchases' on the subscription screen."_
- [ ] Attach any requested screenshots or screen recording to the Apple reply
